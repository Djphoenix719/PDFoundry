# PDFoundry

### This page is for system developers only!

PDFoundry has a pretty simple API. The primary use case you may wish to implement in a system is to implement 'open source page' link on item sheets, so you can link your compendium up to the source locations. Doing something like this is incredibly simple. Bind an event handler to the item sheet render hook.

Assuming you have HTML on your sheet like this.

```html
<div>
    <a class=".open-link">Open</a>
    <input id="source">CRB 191</div>
</div>
```

```typescript
Hooks.on('renderItemSheet', (sheet, html, ...args) => {
    html.find('.open-link', (event) => {
        event.preventDefault();

        const sourceString = html.find('#source').val();
        let [code, page] = sourceString.split(' ');

        ui.PDFoundry.openPDFByCode(code, page);
    })
})
```

That's about it. You now support letting your users enter the source for an item, and have a link to open the PDF right to the page. You'll have to decide what input formats you support. Don't forget, you can search for a PDF by name too - so if you want the users to type a full name (or perhaps you want to support both) that's easily possible too.

Check out the API at... actually you're looking at it. The directory is on the right.