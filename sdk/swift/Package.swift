// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "FluxChat",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "FluxChat",
            targets: ["FluxChat"]
        ),
    ],
    targets: [
        .target(
            name: "FluxChat",
            path: "Sources/FluxChat"
        ),
        .testTarget(
            name: "FluxChatTests",
            dependencies: ["FluxChat"],
            path: "Tests/FluxChatTests"
        ),
    ]
)
