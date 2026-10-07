// vitallens@0.4.5 no expone tipos resolubles (su "exports" solo define condiciones browser/node).
declare module "vitallens" {
  export class VitalLens {
    constructor(options: { method: "vitallens"; proxyUrl?: string; apiKey?: string });
  }
}
