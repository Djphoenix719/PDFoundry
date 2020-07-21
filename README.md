# PDFoundry

![GitHub release (latest by date)](https://img.shields.io/github/v/release/DJPhoenix719/PDFoundry)
[![GitHub issues](https://img.shields.io/github/issues/Djphoenix719/PDFoundry)](https://github.com/Djphoenix719/PDFoundry/issues)
[![GitHub license](https://img.shields.io/github/license/Djphoenix719/PDFoundry)](https://github.com/Djphoenix719/PDFoundry/blob/master/LICENSE)

![Release](https://github.com/Djphoenix719/PDFoundry/workflows/Release/badge.svg)
![Nightly](https://github.com/Djphoenix719/PDFoundry/workflows/Nightly/badge.svg)

A PDF viewer module for Foundry VTT, made for developers to integrate with their systems.

> **Anyone** can install PDFoundry and make use of a limited set of features - without a system integration you still get a fully fledged PDF viewer! 

The goal of this library is to provide system developers with a easy to use and homogenized source support library to provide high quality source links in-application. I'd like to be able to click "view source" in every system, because finding information in PDFs takes a long time!

## Setup for Users
PDFoundry makes use of some features that prevent it from being installed with the normal Foundry VTT installation method.

Installation is easy, however.
1. Find and download your system in the [latest release](https://github.com/Djphoenix719/PDFoundry/releases/latest) - the name should match the folder name in your `data\systems\` folder, and you should ensure you have a matching version by checking your installed version in Foundry VTT.
2. Move the zip file to your `data\systems\{your system}` folder.
3. Extract the files, overwriting all files.

*That's it!*

## System Developers
PDFoundry has a bunch of user-focused features, meaning you don't have to do anything if you decide to integrate it with your system for your players to get a bunch of benefit out of it. However, there's a fully featured API with event hooks and an interface to open PDFs you may be interested in.

#### Building PDFoundry
If you wish to build PDFoundry yourself - most commonly because you want it on a system that doesn't appear on Foundry's website - you can do the following.

1. Clone the respository
2. `npm install`
3. `gulp build`

You have two options for installing it into a system now that PDFoundry is built.

##### Option 1
> Symlink

In my effort to make this as easy as possible, there's a gulp script to help you. Run `gulp link --system your_system_folder_name`

A symlink will allow easy updates by letting you simply do `git pull` then `gulp rebuild`

##### Option 2
> Manual

Copy the "pdfoundry-dist" folder created during the build into your system directory. There is a node script you can use to install.

Run `node pdfoundry-dist/scripts/install.js`.

> :warning: `pdfoundry-dist/scripts/install.js` will not work.

See the [documentation]() for more details and examples.

## Roadmap
See the [development board](https://github.com/Djphoenix719/PDFoundry/projects/1#column-9772243) for a list of planned features, roughly in the order I plan to get to them.
