#!/bin/bash

API_URL="http://127.0.0.1:8000/api/v1"

GREEN="\e[32m"
RED="\e[31m"
BLUE="\e[34m"
YELLOW="\e[33m"
RESET="\e[0m"
CHECK="${GREEN}[✔]${RESET}"
CROSS="${RED}[✘]${RESET}"
INFO="${BLUE}[i]${RESET}"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

function print_title() {
    echo -e "\n${YELLOW}== $1 ==${RESET}"
    ((TOTAL_TESTS++))
}

function print_result() {
    if [[ $1 == 0 ]]; then
        echo -e "${CHECK} $2"
        ((PASSED_TESTS++))
    else
        echo -e "${CROSS} $2"
        ((FAILED_TESTS++))
    fi
}

print_title "📁 Create folder 'testfolder'"
curl -s -X POST "$API_URL/files/folder/create" \
    -H "Content-Type: application/json" \
    -d '{"folder":"testfolder"}' | jq .
print_result $? "Folder created (or already exists)"

print_title "📄 List all files"
curl -s "$API_URL/files/" | jq .
print_result $? "Files listed successfully"

print_title "📤 Upload file 'test.txt' without folder (default)"
curl -s -F "file=@/home/tay/Desktop/Projects/TelegramCloudSystem/TgCloudCLI/downloads/test.txt" "$API_URL/files/upload" | jq .
print_result $? "File uploaded successfully"

print_title "📤 Upload file 'test.txt' to 'testfolder'"
curl -s -F "file=@/home/tay/Desktop/Projects/TelegramCloudSystem/TgCloudCLI/downloads/test.txt" -F "folder=testfolder" "$API_URL/files/upload" | jq .
print_result $? "File uploaded successfully"

print_title "📁 Delete file 'test.txt'"
curl -s -X DELETE "$API_URL/files/test.txt" | jq .
print_result $? "File deleted successfully"

print_title "🔍 Get file by name (test.txt)"
curl -s "$API_URL/files/test.txt" | jq .
print_result $? "File found"

print_title "📂 List files in folder 'testfolder'"
curl -s "$API_URL/files/folder/testfolder" | jq .
print_result $? "Files listed in the folder"

print_title "📥 Download file 'test.txt'"
curl -s -o downloaded_test.txt "$API_URL/files/download/test.txt"
if [ -f downloaded_test.txt ]; then
    print_result 0 "File downloaded successfully"
    rm downloaded_test.txt
else
    print_result 1 "Error downloading the file"
fi

echo -e "\n${BLUE}========= SUMMARY =========${RESET}"
echo -e "Total:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:  $PASSED_TESTS${RESET}"
echo -e "${RED}Failed:  $FAILED_TESTS${RESET}"
echo -e "${BLUE}===========================${RESET}\n"