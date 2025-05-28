#!/bin/bash

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    exit 1
fi

# Create temporary directory
mkdir -p temp_icons

# Generate square icons
convert -background none icon_design.svg -resize 48x48 temp_icons/ic_launcher_mdpi.png
convert -background none icon_design.svg -resize 72x72 temp_icons/ic_launcher_hdpi.png
convert -background none icon_design.svg -resize 96x96 temp_icons/ic_launcher_xhdpi.png
convert -background none icon_design.svg -resize 144x144 temp_icons/ic_launcher_xxhdpi.png
convert -background none icon_design.svg -resize 192x192 temp_icons/ic_launcher_xxxhdpi.png

# Copy to appropriate directories
cp temp_icons/ic_launcher_mdpi.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp temp_icons/ic_launcher_mdpi.png android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png

cp temp_icons/ic_launcher_hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp temp_icons/ic_launcher_hdpi.png android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png

cp temp_icons/ic_launcher_xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp temp_icons/ic_launcher_xhdpi.png android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png

cp temp_icons/ic_launcher_xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp temp_icons/ic_launcher_xxhdpi.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png

cp temp_icons/ic_launcher_xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
cp temp_icons/ic_launcher_xxxhdpi.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png

# Clean up
rm -rf temp_icons

echo "Icon generation complete!"
