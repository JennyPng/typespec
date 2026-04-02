import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  @key id: string;
  name: string;
  color: "red" | "blue";
}

@error
model ServiceError {
  code: string;
  message: string;
}

@route("/widgets")
interface Widgets {
  @get list(): Widget[];

  @get
  @route("/{id}")
  get(@path id: string): Widget | ServiceError;
}
