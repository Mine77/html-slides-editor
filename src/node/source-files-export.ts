import fs from "node:fs/promises";
import path from "node:path";

const ZIP_CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_HEADER = 0x06054b50;
const ZIP_LOCAL_FILE_HEADER = 0x04034b50;
const ZIP_STORE_COMPRESSION_METHOD = 0;

interface SourceFileEntry {
  name: string;
  contents: Buffer;
  crc32: number;
}

export interface SourceFilesExportResult {
  deck: string;
  outFile: string;
  path: string;
  files: string[];
}

export async function exportSourceFiles({
  deckPath,
  outFile,
}: {
  deckPath: string;
  outFile: string;
}): Promise<SourceFilesExportResult> {
  const deck = path.resolve(process.cwd(), deckPath);
  const outputPath = path.resolve(process.cwd(), outFile);
  const files = await collectDeckFiles(deck);
  const zip = createZipArchive(files);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, zip);

  return {
    deck,
    outFile: outputPath,
    path: outputPath,
    files: files.map((file) => file.name),
  };
}

async function collectDeckFiles(rootDir: string, relativeDir = ""): Promise<SourceFileEntry[]> {
  const targetDir = path.join(rootDir, relativeDir);
  const entries = await fs.readdir(targetDir, { withFileTypes: true });
  const nestedEntries = await Promise.all(
    entries.map(async (entry): Promise<SourceFileEntry[]> => {
      const relativePath = path.posix.join(relativeDir, entry.name);

      if (shouldSkipPath(relativePath)) {
        return [];
      }

      const absolutePath = path.join(rootDir, relativePath);
      if (entry.isDirectory()) {
        return collectDeckFiles(rootDir, relativePath);
      }

      const contents = await fs.readFile(absolutePath);

      return [
        {
          name: relativePath,
          contents,
          crc32: getCrc32(contents),
        },
      ];
    })
  );

  return nestedEntries.flat().sort((left, right) => left.name.localeCompare(right.name));
}

function shouldSkipPath(relativePath: string) {
  return relativePath === ".starry-slides" || relativePath.startsWith(".starry-slides/");
}

function createZipArchive(files: SourceFileEntry[]): Buffer {
  const localFileChunks: Buffer[] = [];
  const centralDirectoryChunks: Buffer[] = [];
  let localFileOffset = 0;

  for (const file of files) {
    const fileName = Buffer.from(file.name, "utf8");
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(ZIP_LOCAL_FILE_HEADER, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(ZIP_STORE_COMPRESSION_METHOD, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(file.crc32 >>> 0, 14);
    localHeader.writeUInt32LE(file.contents.length, 18);
    localHeader.writeUInt32LE(file.contents.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localFileChunks.push(localHeader, fileName, file.contents);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(ZIP_CENTRAL_DIRECTORY_HEADER, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(ZIP_STORE_COMPRESSION_METHOD, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(file.crc32 >>> 0, 16);
    centralHeader.writeUInt32LE(file.contents.length, 20);
    centralHeader.writeUInt32LE(file.contents.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(localFileOffset, 42);
    centralDirectoryChunks.push(centralHeader, fileName);

    localFileOffset += localHeader.length + fileName.length + file.contents.length;
  }

  const centralDirectory = Buffer.concat(centralDirectoryChunks);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(ZIP_END_OF_CENTRAL_DIRECTORY_HEADER, 0);
  endOfCentralDirectory.writeUInt16LE(0, 4);
  endOfCentralDirectory.writeUInt16LE(0, 6);
  endOfCentralDirectory.writeUInt16LE(files.length, 8);
  endOfCentralDirectory.writeUInt16LE(files.length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(localFileOffset, 16);
  endOfCentralDirectory.writeUInt16LE(0, 20);

  return Buffer.concat([...localFileChunks, centralDirectory, endOfCentralDirectory]);
}

function getCrc32(contents: Buffer): number {
  let crc = 0xffffffff;
  for (const value of contents) {
    crc = CRC32_TABLE[(crc ^ value) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC32_TABLE = buildCrc32Table();

function buildCrc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}
