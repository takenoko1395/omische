import type { TemplateItemId } from "./template-item-id";
import type { TemplateItemTitle } from "./template-item-title";

export class TemplateItem {
  constructor(
    readonly id: TemplateItemId,
    readonly title: TemplateItemTitle,
  ) {}
}
