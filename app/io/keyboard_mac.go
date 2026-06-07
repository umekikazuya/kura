package io

/*
#cgo CFLAGS: -x objective-c
#cgo LDFLAGS: -framework Cocoa -framework CoreGraphics
#import <Cocoa/Cocoa.h>
#import <CoreGraphics/CoreGraphics.h>
#import <unistd.h>

void hideApplication() {
    dispatch_async(dispatch_get_main_queue(), ^{
        [NSApp hide:nil];
    });
}

bool isApplicationHidden() {
    __block bool hidden = false;
    dispatch_sync(dispatch_get_main_queue(), ^{
        hidden = [NSApp isHidden];
    });
    return hidden;
}

void simulateCmdV() {
    CGEventSourceRef source = CGEventSourceCreate(kCGEventSourceStateHIDSystemState);
    if (source == NULL) {
        return;
    }

    // Virtual keycode for 'v' is 9
    CGEventRef vDown = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, true);
    if (vDown == NULL) {
        CFRelease(source);
        return;
    }
    CGEventSetFlags(vDown, kCGEventFlagMaskCommand);

    CGEventRef vUp = CGEventCreateKeyboardEvent(source, (CGKeyCode)9, false);
    if (vUp == NULL) {
        CFRelease(vDown);
        CFRelease(source);
        return;
    }
    CGEventSetFlags(vUp, kCGEventFlagMaskCommand);

    CGEventPost(kCGHIDEventTap, vDown);
    CGEventPost(kCGHIDEventTap, vUp);

    CFRelease(vDown);
    CFRelease(vUp);
    CFRelease(source);
}
*/
import "C"

// HideApplication hides the entire macOS application to yield focus.
func HideApplication() {
	C.hideApplication()
}

// IsApplicationHidden returns true if the macOS application is currently hidden.
func IsApplicationHidden() bool {
	return bool(C.isApplicationHidden())
}

// SimulateCmdV sends a Command+V keystroke to the macOS system.
func SimulateCmdV() {
	C.simulateCmdV()
}
