# PDFoundry

![GitHub release (latest by date)](https://img.shields.io/github/v/release/DJPhoenix719/PDFoundry)
[![GitHub issues](https://img.shields.io/github/issues/Djphoenix719/PDFoundry)](https://github.com/Djphoenix719/PDFoundry/issues)
[![GitHub license](https://img.shields.io/github/license/Djphoenix719/PDFoundry)](https://github.com/Djphoenix719/PDFoundry/blob/master/LICENSE)

![Release](https://github.com/Djphoenix719/PDFoundry/workflows/Release/badge.svg)
![Nightly](https://github.com/Djphoenix719/PDFoundry/workflows/Nightly/badge.svg)

A PDF viewer module for Foundry VTT, made for developers to integrate with their systems.

The goal of this library is to provide system developers with a easy to use and homogenized source support library to provide high quality source links in-application. I'd like to be able to click "view source" in every system, because finding information in PDFs takes a long time!

## Setup
PDFoundry makes use of some features that prevent it from being installed with the normal Foundry VTT installation method.

Installation is easy, however.
1. Find and download your system in the [latest release](https://github.com/Djphoenix719/PDFoundry/releases/latest) - the name should match the folder name in your `data\systems\` folder, and you should ensure you have a matching version by checking your installed version in Foundry VTT.
2. Move the zip file to your `data\systems\{your system}` folder.
3. Extract the files, overwriting all files.

*That's it!*

## System Developers
PDFoundry has a bunch of user-focused features, meaning you don't have to do anything if you decide to integrate it with your system for your players to get a bunch of benefit out of it. However, there's a fully featured API with event hooks and an interface to open PDFs you may be interested in.

See the [documentation]() for more details and examples.

## Roadmap
See the [development board](https://github.com/Djphoenix719/PDFoundry/projects/1#column-9772243)
