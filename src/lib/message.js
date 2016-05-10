import { format } from './resolver';

export class Message {
  // XXX entity is a Runtime Entry object but it probably should be a string to 
  // be parsed; lang and bundle are passed in as options;  bundle is optional 
  // but required for entity references.
  constructor(entity, {lang, bundle}) {
    this.entity = entity;
    this.lang = lang;
    this.bundle = bundle;
  }

  format(args) {
    const [value] = format(this.bundle, this.lang, args, this.entity);
    return value;
  }


  formatToObject(args) {
    const [value] = format(this.bundle, this.lang, args, this.entity);

    const formatted = {
      value,
      attrs: null,
    };

    if (this.entity.traits) {
      formatted.attrs = Object.create(null);
      for (let trait of this.entity.traits) {
        const [attrValue] = format(this.bundle, this.lang, args, trait);
        formatted.attrs[trait.key.name] = attrValue;
      }
    }

    return formatted;
  }
}
