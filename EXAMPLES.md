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

        if (ui.PDFoundry) {
            ui.PDFoundry.openPDFByCode(code, { page });
        } else {
            ui.notifications.warn('PDFoundry must be installed to use source links.');
        }
    });
});
```



That's about it. You now support letting your users enter the source for an item, and have a link to open the PDF right to the page. You'll have to decide what input formats you support. Don't forget, you can search for a PDF by name too - so if you want the users to type a full name (or perhaps you want to support both) that's easily possible too. You can also see [this repository](https://github.com/Djphoenix719/FVTT-PDFoundryPF2E) for an albeit sloppy example.

### Custom Themes
Custom themes are very easy to create and register. Package up a single CSS file containing your theme style, and a JavaScript file containing a single line (or submit a pull request with your theme in SCSS if you think it's particularly snazzy).

```javascript
Html.on('setup', ui.PDFoundry.registerTheme('your-theme-id', 'Your Theme Name', 'path/to/my/theme/css/from/data/root.css'))
```

Note your theme will be injected into the viewer at runtime. You will not be able to style any Foundry elements (although you could style them with another CSS file referenced from your `module.json`). You can use the inspector to find classes assigned to DOM elements with a PDF open, and there are some simple themes that come packed with the module.

Don't forget to include a reference to your script in the `module.json` for your module.

### Further Reading
Check out the rest of the API on the right.