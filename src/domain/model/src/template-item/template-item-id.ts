export class TemplateItemId {
  readonly value: string;

  constructor(value: string) {
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new Error("IDは空にできません。");
    }
    this.value = normalized;
  }
}
