import samples from "../samples/dist/samples.js";

export const TypeSpecPlaygroundConfig = {
  defaultEmitter: "@typespec/openapi3",
  libraries: [
    "@typespec/compiler",
    "@typespec/http",
    "@typespec/rest",
    "@typespec/openapi",
    "@typespec/versioning",
    "@typespec/openapi3",
    "@typespec/json-schema",
    "@typespec/protobuf",
    "@typespec/streams",
    "@typespec/events",
    "@typespec/sse",
    "@typespec/xml",
    "@azure-tools/typespec-client-generator-core",
    "@azure-tools/typespec-azure-core",
    "@typespec/http-client-python",
  ],
  samples,
} as const;
