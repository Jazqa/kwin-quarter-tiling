#!/bin/sh

plasmapkg2 --type kwinscript -i .
mkdir -p ~/.local/share/kservices5
cp ~/.local/share/kwin/scripts/quarter-tiling/metadata.desktop ~/.local/share/kservices5/kwin-script-quarter-tiling.desktop
