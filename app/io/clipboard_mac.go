package io

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Foundation -framework AppKit
#import <Foundation/Foundation.h>
#import <AppKit/AppKit.h>
#include <stdlib.h>

long getPasteboardChangeCount() {
    @autoreleasepool {
        NSPasteboard *pb = [NSPasteboard generalPasteboard];
        return [pb changeCount];
    }
}

int isConcealed() {
    @autoreleasepool {
        NSPasteboard *pb = [NSPasteboard generalPasteboard];
        NSArray *types = [pb types];
        // Check for standard Apple concealed type and 1Password specific type
        if ([types containsObject:@"org.nspasteboard.ConcealedType"] || [types containsObject:@"com.agilebits.onepassword"]) {
            return 1;
        }
        return 0;
    }
}

char* getPasteboardString() {
    @autoreleasepool {
        NSPasteboard *pb = [NSPasteboard generalPasteboard];
        NSString *str = [pb stringForType:NSPasteboardTypeString];
        if (str == nil) {
            return NULL;
        }
        return strdup([str UTF8String]);
    }
}
*/
import "C"
import (
	"errors"
	"unsafe"
)

// GetClipboardChangeCount returns the current change count of the Mac clipboard.
func GetClipboardChangeCount() int64 {
	return int64(C.getPasteboardChangeCount())
}

// IsClipboardConcealed checks if the current clipboard data is from a password manager.
func IsClipboardConcealed() bool {
	return C.isConcealed() == 1
}

// GetClipboardText gets the string content of the clipboard.
func GetClipboardText() (string, error) {
	cStr := C.getPasteboardString()
	if cStr == nil {
		return "", errors.New("no string data in clipboard")
	}
	defer C.free(unsafe.Pointer(cStr))
	return C.GoString(cStr), nil
}
