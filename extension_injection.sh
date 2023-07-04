#!/bin/bash

repository_url="https://github.com/iamadamdev/bypass-paywalls-chrome"
destination_folder="bypass-paywalls-chrome"
source_file="extension/src/bg/background.js"
source_json="extension/manifest.json"
source_temp_file="extension/src/bg/background_temp.js"

repository_name="bypass-paywalls-chrome"
background_script="src/js/background_core.js"
target_file="$repository_name/$background_script"
dst_json="$repository_name/manifest.json"
zip_file="$repository_name-with-core.zip"
zip_file_folder="$repository_name/"
default_address="ws://127.0.0.1:4343"

if [ ! -d "$destination_folder" ]; then
    git clone "$repository_url" "$destination_folder"

    if ! [ $? -eq 0 ]; then
        echo "clone error!"
        exit
    fi
fi

jq --arg path "$background_script" --argjson scripts "$(jq '.background.scripts' "$dst_json")" '.background.scripts = ( [$path] + $scripts | unique)' "$dst_json" >temp.json && mv temp.json "$dst_json"
jq .background.scripts "$dst_json"
jq --argjson permissions "$(jq '.permissions' $source_json)" '.permissions = ($permissions | unique)' "$dst_json" >temp.json && mv temp.json "$dst_json"
jq .permissions "$dst_json"

if ! command -v javascript-obfuscator &>/dev/null; then
    npm install --save-dev javascript-obfuscator -g
fi

# 判断new_address 是否为空

if [[ -z "$new_address" ]]; then
    read -r -p "Set Address($default_address): " new_address
fi

if [ -n "$new_address" ]; then
    if [[ ! "$new_address" =~ ^(ws|wss):// ]]; then
        echo "error: use ws:// or wss:// "
        exit
    fi
else
    new_address="$default_address"
fi

sed "s|$default_address|$new_address|g" "$source_file" >"$source_temp_file"
echo "Host: $new_address"
javascript-obfuscator "$source_temp_file" --output "$target_file" --compact true --control-flow-flattening true --control-flow-flattening-threshold 1 --dead-code-injection true --dead-code-injection-threshold 1 --debug-protection true --debug-protection-interval 4000 --disable-console-output true --identifier-names-generator hexadecimal --log false --numbers-to-expressions true --rename-globals true --self-defending true --simplify true --split-strings true --split-strings-chunk-length 5 --string-array true --string-array-calls-transform true --string-array-encoding rc4 --string-array-index-shift true --string-array-rotate true --string-array-shuffle true --string-array-wrappers-count 5 --string-array-wrappers-chained-calls true --string-array-wrappers-parameters-max-count 5 --string-array-wrappers-type function --string-array-threshold 1 --transform-object-keys true --unicode-escape-sequence false
rm "$source_temp_file"
rm -f "$zip_file"
zip -q -r "$zip_file" "$zip_file_folder"
