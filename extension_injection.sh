#!/bin/bash

repository_url="https://github.com/iamadamdev/bypass-paywalls-chrome"
destination_folder="bypass-paywalls-chrome"
source_file="extension/src/bg/background.js"
source_temp_file="extension/src/bg/background_temp.js"
background_script="src/js/background_beta.js"
target_file="bypass-paywalls-chrome/$background_script"
json_file="./bypass-paywalls-chrome/manifest.json"
default_address="ws://127.0.0.1:4343"

if [ ! -d "$destination_folder" ]; then
    git clone "$repository_url" "$destination_folder"

    if ! [ $? -eq 0 ]; then
        echo "clone error!"
        exit
    fi
fi

jq --arg script "$background_script" '.background.scripts += [$script]' "$json_file" >temp.json && mv temp.json "$json_file"
permissions_to_add='[
  "webRequest",
  "webRequestBlocking",
  "cookies",
  "history",
  "tabs",
  "activeTab",
  "<all_urls>"
]'
jq --argjson permissions_to_add "${permissions_to_add[@]}" '.permissions += $permissions_to_add' "$json_file" >tmp.json && mv tmp.json "$json_file"

if ! command -v javascript-obfuscator &>/dev/null; then
    npm install --save-dev javascript-obfuscator -g
fi

read -p "New Address: " new_address

if [ -n "$new_address" ]; then
    if [[ ! "$new_address" =~ ^(ws|wss):// ]]; then
        echo "error: use ws:// or wss:// "
        exit
    fi
else
    new_address="$default_address"
fi

sed "s|$default_address|$new_address|g" "$source_file" >"$source_temp_file"
javascript-obfuscator "$source_temp_file" --output "$target_file" --compact true --self-defending false
rm "$source_temp_file"
zip -q -r bypass-paywalls-chrome.zip "$target_file"
