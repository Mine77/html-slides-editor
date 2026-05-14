import {
  Accessibility,
  AlignCenter,
  Baseline,
  Bold,
  Crop,
  Ellipsis,
  Group,
  Italic,
  Layers,
  Link2,
  ListPlus,
  Lock,
  LockOpen,
  Rows3,
  Strikethrough,
  TextAlignJustify,
  Underline,
  Ungroup,
} from "lucide-react";
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  ALIGN_TO_SLIDE_OPTIONS,
  DISTRIBUTE_OPTIONS,
  type ElementToolFeature,
  LAYER_ORDER_OPTIONS,
  TEXT_ALIGN_OPTIONS,
} from "../../../lib/element-tool-model";
import { isFeatureActive } from "../../../lib/element-tool-values";
import { cn } from "../../../lib/utils";
import { FontFamilyCombobox, FontSizeControl } from "../controls/font-controls";
import { Divider, IconButton } from "../primitives";
import {
  AttributeMenuButton,
  LineHeightPopover,
  OptionsPopover,
  type OptionsSectionProps,
  type PopoverSectionProps,
  ToolbarSection,
} from "../controls/option-popovers";
import type { EditableAttributeId, SelectionCommandAvailability } from "../types";
import {
  ICON_STROKE_WIDTH,
  toolbarIconButtonActiveClassName,
  toolbarIconButtonClassName,
  toolbarIconClassName,
} from "../types";
import {
  ColorSection,
  BorderSection,
  MultiArrangeSection,
} from "./color-border-sections";
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";

interface ToolbarSectionsProps {
  activePopoverId: string | null;
  isSelectedElementLocked: boolean;
  selectionCommandAvailability: SelectionCommandAvailability;
  selectedElementType: "text" | "image" | "block" | "group" | "multi";
  showGroupTool: boolean;
  showMultiTools: boolean;
  commitFeature: (feature: ElementToolFeature, nextValue: string) => void;
  getCurrentValue: (feature: ElementToolFeature) => string;
  getFeature: (featureId: ElementToolFeature["id"]) => ElementToolFeature;
  onStylePreview: (propertyName: string, nextValue: string | null) => void;
  setActiveAttributeDialog: Dispatch<SetStateAction<EditableAttributeId | null>>;
  setActivePopoverId: Dispatch<SetStateAction<string | null>>;
}

function ToolbarSections({
  activePopoverId,
  isSelectedElementLocked,
  selectionCommandAvailability,
  selectedElementType,
  showGroupTool,
  showMultiTools,
  commitFeature,
  getCurrentValue,
  getFeature,
  onStylePreview,
  setActiveAttributeDialog,
  setActivePopoverId,
}: ToolbarSectionsProps) {
  const isImageSelection = selectedElementType === "image";

  return (
    <>
      <LockSection
        commitFeature={commitFeature}
        getFeature={getFeature}
        isSelectedElementLocked={isSelectedElementLocked}
        selectionCommandAvailability={selectionCommandAvailability}
        showGroupTool={showGroupTool}
      />
      {isSelectedElementLocked ? null : (
        <>
          <Divider />
          {isImageSelection ? (
            <ImageSection commitFeature={commitFeature} getFeature={getFeature} />
          ) : (
            <>
              <FontSection
                commitFeature={commitFeature}
                getCurrentValue={getCurrentValue}
                getFeature={getFeature}
                onStylePreview={onStylePreview}
                setActivePopoverId={setActivePopoverId}
              />
              <Divider />
              <TextStyleSection
                commitFeature={commitFeature}
                getCurrentValue={getCurrentValue}
                getFeature={getFeature}
              />
              <Divider />
              <ColorSection
                activePopoverId={activePopoverId}
                commitFeature={commitFeature}
                getCurrentValue={getCurrentValue}
                getFeature={getFeature}
                onStylePreview={onStylePreview}
                selectionCommandAvailability={selectionCommandAvailability}
                setActivePopoverId={setActivePopoverId}
              />
              <Divider />
              <ParagraphSection
                activePopoverId={activePopoverId}
                commitFeature={commitFeature}
                getCurrentValue={getCurrentValue}
                getFeature={getFeature}
                onStylePreview={onStylePreview}
                selectionCommandAvailability={selectionCommandAvailability}
                setActivePopoverId={setActivePopoverId}
              />
            </>
          )}
          {isImageSelection ? (
            <>
              <Divider />
              <BorderSection
                activePopoverId={activePopoverId}
                commitFeature={commitFeature}
                getCurrentValue={getCurrentValue}
                getFeature={getFeature}
                onStylePreview={onStylePreview}
                selectionCommandAvailability={selectionCommandAvailability}
                setActivePopoverId={setActivePopoverId}
              />
            </>
          ) : null}
          {showMultiTools ? (
            <>
              <Divider />
              <MultiArrangeSection
                activePopoverId={activePopoverId}
                commitFeature={commitFeature}
                getCurrentValue={getCurrentValue}
                getFeature={getFeature}
                onStylePreview={onStylePreview}
                selectionCommandAvailability={selectionCommandAvailability}
                setActivePopoverId={setActivePopoverId}
              />
            </>
          ) : null}
          <Divider />
          <OtherSection
            activePopoverId={activePopoverId}
            setActiveAttributeDialog={setActiveAttributeDialog}
            setActivePopoverId={setActivePopoverId}
          />
        </>
      )}
    </>
  );
}

function ImageSection({
  commitFeature,
  getFeature,
}: Pick<ToolbarSectionsProps, "commitFeature" | "getFeature">) {
  return (
    <ToolbarSection>
      <IconButton
        label="Crop image"
        onClick={() => commitFeature(getFeature("image-crop"), "cover")}
      >
        <Crop className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
      </IconButton>
    </ToolbarSection>
  );
}

function LockSection({
  commitFeature,
  getFeature,
  isSelectedElementLocked,
  selectionCommandAvailability,
  showGroupTool,
}: Pick<
  ToolbarSectionsProps,
  | "commitFeature"
  | "getFeature"
  | "isSelectedElementLocked"
  | "selectionCommandAvailability"
  | "showGroupTool"
>) {
  return (
    <ToolbarSection>
      <IconButton
        label={isSelectedElementLocked ? "Unlock" : "Lock"}
        active={isSelectedElementLocked}
        onClick={() => commitFeature(getFeature("locked"), isSelectedElementLocked ? "" : "true")}
      >
        {isSelectedElementLocked ? (
          <LockOpen className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
        ) : (
          <Lock className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
        )}
      </IconButton>
      {isSelectedElementLocked || !showGroupTool ? null : (
        <GroupButton
          commitFeature={commitFeature}
          getFeature={getFeature}
          selectionCommandAvailability={selectionCommandAvailability}
        />
      )}
    </ToolbarSection>
  );
}

function FontSection({
  commitFeature,
  getCurrentValue,
  getFeature,
  onStylePreview,
  setActivePopoverId,
}: Pick<
  ToolbarSectionsProps,
  "commitFeature" | "getCurrentValue" | "getFeature" | "onStylePreview" | "setActivePopoverId"
>) {
  const fontFamilyFeature = getFeature("font-family");
  const fontSizeFeature = getFeature("font-size");

  return (
    <ToolbarSection>
      <FontFamilyCombobox
        currentValue={getCurrentValue(fontFamilyFeature)}
        onCommit={(nextValue) => commitFeature(fontFamilyFeature, nextValue)}
        onOpen={() => setActivePopoverId(null)}
        onPreview={(nextValue) => onStylePreview("font-family", nextValue)}
      />
      <FontSizeControl
        currentValue={getCurrentValue(fontSizeFeature)}
        feature={fontSizeFeature}
        onCommitFeature={commitFeature}
      />
    </ToolbarSection>
  );
}

function TextStyleSection({
  commitFeature,
  getCurrentValue,
  getFeature,
}: Pick<ToolbarSectionsProps, "commitFeature" | "getCurrentValue" | "getFeature">) {
  return (
    <ToolbarSection>
      {[
        { feature: getFeature("font-bold"), icon: Bold },
        { feature: getFeature("font-italic"), icon: Italic },
        { feature: getFeature("font-underline"), icon: Underline },
        { feature: getFeature("font-strikethrough"), icon: Strikethrough },
      ].map(({ feature, icon: Icon }) => {
        const active = isFeatureActive(feature, getCurrentValue(feature));
        return (
          <IconButton
            key={feature.id}
            label={feature.label}
            active={active}
            onClick={() => commitFeature(feature, active ? "" : "true")}
          >
            <Icon className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
          </IconButton>
        );
      })}
    </ToolbarSection>
  );
}

function ParagraphSection(props: OptionsSectionProps) {
  return (
    <ToolbarSection>
      <LineHeightPopover
        {...props}
        feature={props.getFeature("line-height")}
        icon={<ListPlus className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />}
        label="Line height"
        popoverId="line-height"
      />
      <OptionsPopover
        {...props}
        feature={props.getFeature("text-align")}
        icon={<TextAlignJustify className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />}
        label="Text align"
        options={TEXT_ALIGN_OPTIONS}
        popoverId="text-align"
      />
    </ToolbarSection>
  );
}

function GroupButton({
  commitFeature,
  getFeature,
  selectionCommandAvailability,
}: Pick<
  ToolbarSectionsProps,
  "commitFeature" | "getFeature" | "selectionCommandAvailability"
>) {
  const canUngroup = selectionCommandAvailability.ungroup;
  const feature = getFeature(canUngroup ? "ungroup" : "group");

  return (
    <ToolbarSection>
      <IconButton
        label={canUngroup ? "Ungroup" : "Group"}
        onClick={() => commitFeature(feature, canUngroup ? "ungroup" : "group")}
      >
        {canUngroup ? (
          <Ungroup className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
        ) : (
          <Group className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
        )}
      </IconButton>
    </ToolbarSection>
  );
}

function OtherSection({
  activePopoverId,
  setActiveAttributeDialog,
  setActivePopoverId,
}: Pick<
  ToolbarSectionsProps,
  "activePopoverId" | "setActiveAttributeDialog" | "setActivePopoverId"
>) {
  const openAttributeDialog = (dialogId: EditableAttributeId) => {
    setActivePopoverId(null);
    setActiveAttributeDialog(dialogId);
  };

  return (
    <ToolbarSection>
      <Popover
        open={activePopoverId === "other"}
        onOpenChange={(open) => setActivePopoverId(open ? "other" : null)}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Other"
            title="Other"
            className={cn(
              toolbarIconButtonClassName,
              activePopoverId === "other" && toolbarIconButtonActiveClassName
            )}
          >
            <Ellipsis className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-1.5">
          <AttributeMenuButton
            icon={<Link2 className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />}
            label="Link"
            onClick={() => openAttributeDialog("other-link")}
          />
          <AttributeMenuButton
            icon={
              <Accessibility className={toolbarIconClassName} strokeWidth={ICON_STROKE_WIDTH} />
            }
            label="ARIA label"
            onClick={() => openAttributeDialog("other-aria-label")}
          />
        </PopoverContent>
      </Popover>
    </ToolbarSection>
  );
}

export { ToolbarSections };
