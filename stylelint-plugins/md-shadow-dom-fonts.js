/**
 * Stylelint plugin: require Shadow DOM font tokens for Material Web components.
 *
 * Material Web components render labels inside Shadow DOM — font-family
 * inheritance is blocked there. Each component exposes a `--md-*-label-text-font`
 * custom property that *does* penetrate the Shadow DOM. This rule enforces that
 * whenever a stylesheet sets any token for a given component (colors, container,
 * etc.), the required font token must exist SOMEWHERE in the file (typically :root).
 *
 * Covered components:
 *   md-navigation-bar / md-navigation-tab  →  --md-navigation-tab-label-text-font
 *   md-filled-button                        →  --md-filled-button-label-text-font
 *   md-outlined-button                      →  --md-outlined-button-label-text-font
 *   md-list-item                            →  --md-list-item-label-text-font
 *   md-filter-chip                          →  --md-filter-chip-label-text-font
 *   md-input-chip                           →  --md-input-chip-primary-label-text-font
 */

import stylelint from 'stylelint'

const ruleName = 'plugin/md-shadow-dom-fonts'

const meta = { url: 'local', fixable: false }

const GROUPS = [
  {
    triggers: ['--md-navigation-bar-', '--md-navigation-tab-'],
    required: '--md-navigation-tab-label-text-font',
    label: 'md-navigation-bar/tab',
  },
  {
    triggers: ['--md-filled-button-'],
    required: '--md-filled-button-label-text-font',
    label: 'md-filled-button',
  },
  {
    triggers: ['--md-outlined-button-'],
    required: '--md-outlined-button-label-text-font',
    label: 'md-outlined-button',
  },
  {
    triggers: ['--md-list-item-'],
    required: '--md-list-item-label-text-font',
    label: 'md-list-item',
  },
  {
    triggers: ['--md-filter-chip-'],
    required: '--md-filter-chip-label-text-font',
    label: 'md-filter-chip',
  },
  {
    triggers: ['--md-input-chip-'],
    required: '--md-input-chip-primary-label-text-font',
    label: 'md-input-chip',
  },
]

const rule = () => (root, result) => {
  // Pass 1: collect every custom property declared anywhere in the file
  const allProps = new Set()
  root.walkDecls((decl) => {
    if (decl.prop.startsWith('--')) allProps.add(decl.prop)
  })

  // Pass 2: for each rule block, check triggered groups against the file-wide set
  // Report once per (file × group) — track which groups already reported
  const reported = new Set()

  root.walkRules((ruleNode) => {
    const blockProps = new Set()
    ruleNode.walkDecls((decl) => {
      if (decl.prop.startsWith('--')) blockProps.add(decl.prop)
    })

    for (const { triggers, required, label } of GROUPS) {
      if (reported.has(required)) continue

      const triggered = triggers.some((prefix) =>
        [...blockProps].some((p) => p.startsWith(prefix))
      )
      if (triggered && !allProps.has(required)) {
        reported.add(required)
        stylelint.utils.report({
          ruleName,
          result,
          node: ruleNode,
          message: `${label}: "${required}" is never declared in this stylesheet — font-family is blocked by Shadow DOM and won't inherit without this token`,
        })
      }
    }
  })
}

rule.ruleName = ruleName
rule.meta = meta

export default { ruleName, rule, meta }
