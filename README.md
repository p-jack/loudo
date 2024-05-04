# loudo

Small and simple MVC framework for TypeScript.

```Typescript
import { el, oneOff} from "loudo"

const model = oneOff({count:0})
document.body.add(
  el(h1).bindInner(model, "count"),
  el(button).inner("Increment").on("click", ()=>{model.count++})
)
```
