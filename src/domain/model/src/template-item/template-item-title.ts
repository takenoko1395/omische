export class TemplateItemTitle {
  readonly value: string;

  constructor(value: string) {
    const normalized = value.trim();
    if (normalized.length === 0) {
      throw new Error("タイトルは空にできません。");
    }
    this.value = normalized;
  }
}
