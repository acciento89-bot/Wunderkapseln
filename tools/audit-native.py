#!/usr/bin/env python3
"""Read-only capability gate for a merged Android manifest or an iOS Info.plist.

No network calls and no modification of input. A passing generated-file audit is
not a compiled artifact, code signature, app-store review or device test.
"""
import argparse
import json
from pathlib import Path
import plistlib
import sys
import xml.etree.ElementTree as ET
from xml.parsers.expat import ExpatError

ANDROID_APP_ID = "com.kamilunavo.wunderkapseln"
IOS_APP_ID = "com.kamilunavo.wondercaps"
IOS_DISPLAY_NAME = "WonderCaps"
ANDROID = "{http://schemas.android.com/apk/res/android}"
TOOLS = "{http://schemas.android.com/tools}"
# ExpoAudio uses AudioManager mode/speaker routing for foreground playback.
# MODIFY_AUDIO_SETTINGS is a normal permission; it does not authorize recording.
ALLOWED_PERMISSIONS = {"android.permission.INTERNET", "android.permission.VIBRATE", "android.permission.ACCESS_NETWORK_STATE", "android.permission.MODIFY_AUDIO_SETTINGS"}
PRIVATE_PERMISSION = ANDROID_APP_ID + ".DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
USAGE_KEYS = {
    "NSMicrophoneUsageDescription", "NSCameraUsageDescription", "NSPhotoLibraryUsageDescription",
    "NSPhotoLibraryAddUsageDescription", "NSLocationWhenInUseUsageDescription",
    "NSLocationAlwaysUsageDescription", "NSLocationAlwaysAndWhenInUseUsageDescription",
    "NSUserTrackingUsageDescription", "NSContactsUsageDescription", "NSCalendarsUsageDescription",
    "NSCalendarsFullAccessUsageDescription", "NSCalendarsWriteOnlyAccessUsageDescription",
    "NSBluetoothAlwaysUsageDescription", "NSBluetoothPeripheralUsageDescription", "NSMotionUsageDescription",
    "NSHealthShareUsageDescription", "NSHealthUpdateUsageDescription", "NSSpeechRecognitionUsageDescription",
}


def android_report(data):
    if b"<!DOCTYPE" in data.upper() or b"<!ENTITY" in data.upper():
        raise ValueError("unsupported_xml_declaration")
    root = ET.fromstring(data)
    errors = []
    if root.tag != "manifest":
        errors.append("invalid_manifest_root")
    identity = root.get("package") == ANDROID_APP_ID
    if not identity:
        errors.append("application_id_mismatch")
    if any(key.startswith(TOOLS) for element in root.iter() for key in element.attrib):
        errors.append("unmerged_manifest")
    permissions = sorted({element.get(ANDROID + "name", "") for element in root
                          if element.tag in ("uses-permission", "uses-permission-sdk-23", "uses-permission-sdk-m")})
    declarations = {element.get(ANDROID + "name"): element.get(ANDROID + "protectionLevel")
                    for element in root.findall("permission")}
    for name in permissions:
        if name == PRIVATE_PERMISSION:
            if declarations.get(name) != "signature":
                errors.append("unsafe_private_permission")
        elif name not in ALLOWED_PERMISSIONS:
            errors.append("unapproved_permission:" + name)
    for name, protection in declarations.items():
        if name != PRIVATE_PERMISSION or protection != "signature":
            errors.append("unsafe_private_permission")
    applications = root.findall("application")
    if len(applications) != 1:
        errors.append("invalid_application_count")
    for app in applications:
        if app.get(ANDROID + "debuggable", "false") != "false":
            errors.append("debuggable_release")
        if app.get(ANDROID + "usesCleartextTraffic", "false") != "false":
            errors.append("cleartext_traffic_enabled")
        if app.get(ANDROID + "requestLegacyExternalStorage", "false") != "false":
            errors.append("legacy_external_storage_enabled")
        for service in app.findall("service"):
            name = service.get(ANDROID + "name", "")
            if service.get(ANDROID + "foregroundServiceType") or "AudioControlsService" in name or "AudioRecordingService" in name:
                errors.append("background_service_enabled")
    return {"platform": "android", "scope": "merged-manifest", "identityVerified": identity,
            "permissions": permissions, "errors": sorted(set(errors))}


def ios_report(data, allow_unresolved):
    if b"<!ENTITY" in data.upper():
        raise ValueError("unsupported_xml_entity")
    config = plistlib.loads(data)
    if not isinstance(config, dict):
        raise ValueError("invalid_plist_root")
    errors = []
    bundle_id = config.get("CFBundleIdentifier")
    identity = bundle_id == IOS_APP_ID
    display_name = config.get("CFBundleDisplayName") == IOS_DISPLAY_NAME
    if not display_name:
        errors.append("ios_display_name_mismatch")
    if config.get("CFBundleName", IOS_DISPLAY_NAME) != IOS_DISPLAY_NAME:
        errors.append("ios_bundle_name_mismatch")
    unresolved = bundle_id == "$(PRODUCT_BUNDLE_IDENTIFIER)"
    if not identity and not (allow_unresolved and unresolved):
        errors.append("application_id_mismatch")
    for key in sorted(USAGE_KEYS):
        if key in config:
            errors.append("unapproved_usage_description:" + key)
    if config.get("UIBackgroundModes"):
        errors.append("background_modes_enabled")
    if config.get("NSAppTransportSecurity", {}).get("NSAllowsArbitraryLoads"):
        errors.append("arbitrary_network_loads_enabled")
    return {"platform": "ios", "scope": "generated-config-only" if unresolved else "resolved-plist",
            "identityVerified": identity, "displayNameVerified": display_name, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    platform = parser.add_mutually_exclusive_group(required=True)
    platform.add_argument("--android", type=Path)
    platform.add_argument("--ios", type=Path)
    parser.add_argument("--allow-unresolved-identity", action="store_true",
                        help="Only for generated iOS config; explicitly does not verify the built bundle identity.")
    args = parser.parse_args()
    path = args.android or args.ios
    try:
        if path.stat().st_size > 5_000_000:
            raise ValueError("manifest_too_large")
        data = path.read_bytes()
        if args.android and args.allow_unresolved_identity:
            raise ValueError("unresolved_mode_only_for_ios")
        report = android_report(data) if args.android else ios_report(data, args.allow_unresolved_identity)
    except (OSError, ValueError, ET.ParseError, ExpatError, plistlib.InvalidFileException, AttributeError, TypeError) as error:
        report = {"platform": "android" if args.android else "ios", "errors": ["native_input_invalid:" + type(error).__name__],
                  "identityVerified": False}
    report.update({"schema": 1, "input": str(path), "capabilitiesPassed": not report["errors"], "nativeBuildVerified": False})
    print(json.dumps(report, indent=2, sort_keys=True))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    sys.exit(main())
