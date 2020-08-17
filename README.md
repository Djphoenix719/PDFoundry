# PDFoundry

![GitHub release (latest by date)](https://img.shields.io/github/v/release/DJPhoenix719/PDFoundry)
[![GitHub issues](https://img.shields.io/github/issues/Djphoenix719/PDFoundry)](https://github.com/Djphoenix719/PDFoundry/issues)
[![GitHub license](https://img.shields.io/github/license/Djphoenix719/PDFoundry)](https://github.com/Djphoenix719/PDFoundry/blob/master/LICENSE)

![Release](https://github.com/Djphoenix719/PDFoundry/workflows/Release/badge.svg)

PDFoundry is a *fully featured* PDF viewer for FoundryVTT!  PDFoundry supports a full suite of features for viewing PDFs right in Foundry VTT. Fillable forms, bookmarks, page links in journals and LOTS more. You can even use a form fillable PDF character sheet for an actor!

## Setup
PDFoundry is easily installable - find it in the modules list inside Foundry VTT. Alternatively, you can use the manifest link below.

<p align="center">
    [Please consider supporting PDFoundry on Ko-Fi](https://ko-fi.com/djsmods)
</p>

### Manifest
> https://raw.githubusercontent.com/Djphoenix719/PDFoundry/master/module.json


## System Developers
PDFoundry has a bunch of user-focused features, meaning you don't have to do anything if you decide to integrate it with your system for your players to get a bunch of benefit out of it. However, there's a fully featured API with event hooks and an interface to open PDFs you may be interested in.

### Building PDFoundry
If you wish to build PDFoundry yourself - most commonly because you want it on a system that doesn't appear on Foundry's website - you can do the following.

1. Clone the repository to your modules folder
2. Open a terminal, navigate to the repository directory
3. Run `npm install`
4. Run `gulp build`

You have two options for installing it into a system now that PDFoundry is built.

> :warning: Both the below options assume your have cloned the repository into `data\modules\pdfoundry`. If you have not, copy the root repository folder into your modules folder now.

##### Option 1
> Symlink

A symbolic link will allow easy updates by letting run `git pull && gulp rebuild`

1. Navigate to the repository directory in a terminal window
2. Run `gulp link --system your_system_folder_name`

##### Option 2
> Manual

If you don't wish to use a symbolic link you can just install it once.

1. Navigate to the repository directory in a terminal window
2. Run `gulp install --system your_system_folder_name`

### API Examples

See the [documentation](https://djphoenix719.github.io/PDFoundry/index.html) for details and examples.

## Roadmap
See the [development board](https://github.com/Djphoenix719/PDFoundry/projects/1#column-9772243) for a list of planned features, roughly in the order I plan to get to them.
