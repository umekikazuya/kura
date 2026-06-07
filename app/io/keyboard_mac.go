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

void showApplication() {
    dispatch_async(dispatch_get_main_queue(), ^{
        [NSApp unhide:nil];
        [NSApp activateIgnoringOtherApps:YES];
    });
}

void setActivationPolicyAccessory() {
    dispatch_async(dispatch_get_main_queue(), ^{
        [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];
    });
}

bool isApplicationHidden() {
    if ([NSThread isMainThread]) {
        return [NSApp isHidden];
    }
    __block bool hidden = false;
    dispatch_sync(dispatch_get_main_queue(), ^{
        hidden = [NSApp isHidden];
    });
    return hidden;
}

bool isApplicationActive() {
    if ([NSThread isMainThread]) {
        return [NSApp isActive];
    }
    __block bool active = false;
    dispatch_sync(dispatch_get_main_queue(), ^{
        active = [NSApp isActive];
    });
    return active;
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

// ShowApplication unhides and activates the macOS application.
func ShowApplication() {
	C.showApplication()
}

// IsApplicationHidden returns true if the macOS application is currently hidden.
func IsApplicationHidden() bool {
	return bool(C.isApplicationHidden())
}

// IsApplicationActive returns true if the macOS application is currently active.
func IsApplicationActive() bool {
	return bool(C.isApplicationActive())
}

// SetActivationPolicyAccessory hides the dock icon by setting the activation policy.
func SetActivationPolicyAccessory() {
	C.setActivationPolicyAccessory()
}

// SimulateCmdV sends a Command+V keystroke to the macOS system.
func SimulateCmdV() {
	C.simulateCmdV()
}
