# loudo

Small and simple MVC framework for TypeScript.

```Typescript
import { el, oneOff } from "loudo"

const model = oneOff({ count:0 })
document.body.add(
  el(h1).bindInner(model, "count"),
  el(button, "Increment").on("click", () => { model.count++ })
)
```

## Models

### Schema Classes

You create models via a schema class, and you create schema
classes via loudo's `define` function. The `define` function
produces a class that can be used to create models:

```TypeScript
import { define } from "loudo"

class User extends define({
  id: { v:1, min:1, readonly:true },
  username: { v:"", min:5, max:30 },
  avatar: { v:"", required:false, regex:/^https:\/\//}
}) {}

const user = new User({id:1, username:"batman"})
```

The above syntax probably looks strange to you. Technically it's
not necessary for `User` to extend the `define` call; you could
do the same with:

```TypeScript
const User = define(/* ... */)
```

However, having `User` extend the `define` call provides three
benefits. One, it makes it clear that `User` is a class. Two, it
makes working with tools like IntelliSense much nicer, because the
class has a name instead of being a deeply nested collection of
subtypes. And three, it provides a natural place to add getters
for computed properties or methods that operate on the object.

### Parsing Models

You can also create models from JSON using loudo's `parse`
function. Unlike `JSON.parse`, loudo's `parse` takes in a
schema class and ensures that the input matches the schema:

```TypeScript
import { parse } from "loudo"

const json = `{"id":1,"username":"batman","avatar":null}`
const user = parse(User, json)
```

### Applying the Schema

You can't create an instance of a schema class with invalid
properties, because the class checks inputs against the schema.
Both of these attempts to create a `User` will fail with a
`CheckError`:

```TypeScript
const attempt1 = new User(id:1, username:"")
// CheckError: username length of 0 is < minimum length of 5

const json = `{"id":1,"username":"batman","avatar":"javascript:alert(1)"}`
const attempt2 = parse(User, json)
// CheckError: avatar does match regex
```

The instances also check properties when they are set. These
attempts will also fail with `CheckError`:

```TypeScript
user.username = "" 
// CheckError: username length of 0 is < minimum length of 5

user.avatar = "javascript:alert(1)"
// CheckError: avatar does not match regex
```

### Listening for Changes

Models in loudo are also "loud", meaning they can broadcast
their changes to listeners:

```TypeScript
user.hear("username", user => {
  console.log("user's username changed to " + user.username)
})
```

### One-Off Models

For small models or singletons, a schema class might be overkill.
You can use the `oneOff` function to make an existing object
loud, allowing you to bind it to views later.

```TypeScript
import { oneOff } from "loudo"

const viewModel = oneOff({loading:true})
```

## Views

Views in loudo are just `HTMLElement` instances. There is no
virtual DOM or component layer.

### The `El` Library

The loudo framework integrates with the
[`el`](https://github.com/p-jack/el) library to quickly create
hierarchies of `HTMLElement` instances in pure TypeScript, without
needing JSX or additional build steps:

```TypeScript
import { el } from "loudo"

document.body.add(
  el("h1", "Hello, world!"),
  el("p").add(
    el("span", "This is an example of"),
    el("code", "el"),
    el("span", "in action! For more information, see"),
    el("a", "the github page", {href:"https://github.com/p-jack/el"}),
    el("span", ".")
  )
)
```

### XSS

The `el` library uses the 
[xss-whitelist](https://github.com/p-jack/xss-whitelist) library
to help prevent Cross-Site Scripting (XSS) attacks. By default,
`el` will refuse to create problematic tags or to add problematic
attributes to them. See that project's documentation for how
to add additional tags and attributes to the whitelist.

## Binding Models to Views

The loudo framework adds several methods to `HTMLElement` to
make it easy to bind models to views.

### `bindInner`

The `bindInner` method changes the `innerText` of an `HTMLElement`
in response to a model change:

```TypeScript
const user = new User({id:1, username:"batman"})
const h1 = el("h1").bindInner(user, "username")
// h1.innerText is now "batman"
user.username = "robin"
// h1.innerText is now "robin"
```

### `bindAttr`

The `bindAttr` method changes an attribute's value, or removes
the attribute, in response to a model change:

```TypeScript
const user = new User({id:1, username:"batman"})
const input = el("input", {type:"text"})
  .bindAttr("value", user, "username")
// input.getAttribute("value") is now "batman"
user.username = "robin"
// input.getAttribute("value") is now "robin"
```

### `bindCSS`

The `bindCSS` method changes the element's `style` properties
in response to a model change:

```TypeScript
const viewModel = oneOff({ darkMode:false })
document.body.bindCSS(viewModel, "darkMode", vm => {
  if (vm.darkMode) {
    return { background:"black", color:"white" }
  } else {
    return { background:"white", color:"black" }
  }
})
// document.body.style.background is "white"
viewModel.darkMode = true
// document.body.style.background is "black"
```

### `bindReplace`

The `bindReplace` method changes an element's children in 
response to a model change:

```TypeScript
type NavTabs = "posts" | "dms" | "account"
const nav = oneOff({ tab:"posts" as NavTabs })
document.body.add(
  navbar(nav),
  el("main").bindReplace(nav, "tab", nav => {
    switch (nav.tab) {
      case "posts": return postsView()
      case "dms": return dmsView()
      case "account": return accountView()
    }
  })
)
// document is now rendering the result of postsView()
nav.tab = "account"
// document is now rendering the result of accountView()
```

This can be used for routing for single-page apps. See the `Tab`
section below for more details on SPA routing.

### `unbind`

The `unbind` method removes any and all model bindings from
an `HTMLElement`. This can be useful if you want to recycle a
view hierarchy, such as the cells in a grid view.

### `lingerBindings`

By default, an `HTMLElement` instance's model bindings remain
until the element is removed from the page. That's usually what
you want, but if you want to recycle elements, you need to
call `lingerBindings` to prevent the default behavior. After a
call to `lingerBindings`, bindings will never be removed 
automatically, and you will have to use `unbind` to remove them
manually.

## Controllers

Controllers are functions that take models as input and produce
bound views. Those views are either added directly to some other
`HTMLElement` (via its `appendChild` method, or via the `add`
method provided by `el`) or added as the result of a model change
(via `bindReplace`.)

There are a number of loudo conventions surrounding
controllers. Those conventions are not enforced, but following
them makes developing large applications easier.

### Signature

By convention, each controller should take exactly two parameters:
an object containing the models the controller needs to bind to
its produced view, and an object containing the services the
controller needs to add behavior to its produced view.

A "service" in this context is any function or object that
provides resources or behavior from a third-party source, such
as the client to a REST API or an analytics logger.

Here's a hypothetical example controller function:

```TypeScript
export const accountView = (models:Models, services:Service) => {
  // ...
}
```

This convention helps with two things. One, following it along with
the folder and file structure conventions eliminates most drilling.
And two, controllers become much easier to unit test, because they
are merely functions of their parameters. There is no global state or
subsystems that might interfere with the controller's behavior. 
You can trivially mock the services and use real models for the test.

### Folder Structure

Organize your project by feature, and put all controllers for the feature
in the same directory or its subdirectories.

The feature directory should contain a file called `inputs.ts` that
defines the `Models` and `Services` interfaces for the controllers in
the directory (and possibly for the controllers in its subdirectories.)

### File Structure

In general, a TypeScript source file should only export one
controller function. That source file may internally define other
sub-controllers, but only the topmost one should be exported.

A controller's produced view will typically be made of dozens of
smaller elements. Rather than include the CSS styles for those
elements in a separate file, you can create functions that
produce the desired styling. You can do that with the `css`
method provided by `el`, or by using a third-party library such as
[`styled-elements`](https://github.com/styled-components/styled-elements).

Here's an example element function using `el`:

```TypeScript
const section = () => el("section").css({
  backgroundColor:"#",
})

const buyNow = () => el("button").css({
  fontSize: "24pt",
  background: "white",
  color: "black",
  border: "none",
  borderRadius: "25px",
  height: "50px",
  width: "200px",
})

const finePrint = (text:string) => el("p", text).css({
  fontSize: "9pt", color:"#CCCCCC"
})
```

Your controller function might then look like:

```TypeScript
export callToAction = (models:Models, services:Services) => {
  return section().add(
    buyNow().on("click", () => tab.goTo("buy-now")),
    finePrint("All sales are final."),
  )
}
```

## The Tab Model

The loudo framework provides an model, simply called `tab`, that
provides information about the current tab. It's similar to the
global `window` object, except that it's also loud: You can hear its
changes, and therefore bind it to elements like any other model.

The properties on `tab` are read-only, but you can force a change
to the tab's location using its `goTo` method:

```TypeScript
import { tab } from "loudo"

document.body.add(
  el("button", "next").on("click", () => tab.goTo("/next"))
)
```

You can hear to the `goTo` event to handle single-page application routing:

```TypeScript
import { tab } from "loudo"

const globalModels = { /* ... */ }
const globalServices = { /* ... */ }

document.body.bindReplace(tab, "goTo", () => {
  const path = tab.path
  if (path.startsWith("/orders")) {
    return orders(globalModels, globalServices)
  }
  if (path.startsWith("/account")) {
    return account(globalModels, globalServices)
  }
  return err404()
})
```

The `tab` model also provides `width` and `height` properties that
you can hear changes to for responsive design.
