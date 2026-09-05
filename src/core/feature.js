export class Feature {
  constructor({ name, detect, load }) {
    if (typeof name !== "string" || name.length === 0) {
      throw new Error("Feature requires a non-empty name");
    }
    if (typeof detect !== "function") {
      throw new Error(`Feature "${name}" requires a detect function`);
    }
    if (typeof load !== "function") {
      throw new Error(`Feature "${name}" requires a load function`);
    }

    this.name = name;
    this.detectFn = detect;
    this.loadFn = load;
    this.modulePromise = null;
  }

  detect(context) {
    return Boolean(this.detectFn(context));
  }

  load() {
    if (!this.modulePromise) {
      this.modulePromise = this.loadFn();
    }
    return this.modulePromise;
  }

  async activate(context) {
    const module = await this.load();
    const activate = module?.activate ?? module?.default;

    if (typeof activate !== "function") {
      throw new Error(`Feature "${this.name}" module must export activate(context)`);
    }

    return activate(context);
  }
}
