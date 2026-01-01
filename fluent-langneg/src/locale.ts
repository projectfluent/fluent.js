export class LocaleWrapper extends Intl.Locale {
  variants?: string;

  constructor(locale: string) {
    let tag = locale
      .replace(/_/g, "-")
      .replace(/^\*/, "und")
      .replace(/-\*/g, "");

    super(tag);

    if (!("variants" in this)) {
      // Available on Firefox 141 & later
      let lsrTagLength = this.language.length;
      if (this.script) lsrTagLength += this.script.length + 1;
      if (this.region) lsrTagLength += this.region.length + 1;

      if (tag.length > lsrTagLength) {
        let unicodeExtStart: number | undefined = tag.search(/-[a-zA-Z]-/);
        if (unicodeExtStart === -1) unicodeExtStart = undefined;
        this.variants = tag.substring(lsrTagLength + 1, unicodeExtStart);
      }
    }
  }

  get language(): string {
    return super.language ?? "und";
  }
}
