# Design review — home data wiring

## Required defects

- Large membership amounts can overflow a two-column `InfoBox`; values need compact formatting or one-line truncation.
- Dynamic diet and membership-chip values have no width constraint and can overflow their fixed two-column cards.

## Recommendations

- Strengthen the empty membership state with a benefit or approved Figma asset.
- Replace remaining gray visual placeholders with intended assets or icons when the asset scope is approved.
- Confirm small icon sizes and stroke widths against Figma before changing them.

## Positive observations

- Section hierarchy and vertical rhythm match the current token scale.
