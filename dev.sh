npm run transpile
kwriteconfig6 --file kwinrc --group Plugins --key yaktsEnabled false
qdbus org.kde.KWin /KWin reconfigure
kpackagetool6 --type=KWin/Script -r yakts || true
kpackagetool6 --type=KWin/Script -i .
kwriteconfig6 --file kwinrc --group Plugins --key yaktsEnabled true
qdbus org.kde.KWin /KWin reconfigure