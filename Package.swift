// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CapacitorBlobWriter",
    platforms: [.iOS(.v12)],
    products: [
        .library(
            name: "CapacitorBlobWriter",
            targets: ["BlobWriterPlugin"]
        )
    ],
    dependencies: [
        .package(
            url: "https://github.com/ionic-team/capacitor-swift-pm.git",
            from: "8.0.0"
        ),
        .package(
            url: "https://github.com/ubiregiinc/GCDWebServer.git",
            revision: "a206ce627d5a612494e1d0b77b14ccfd582c528e"
        )
    ],
    targets: [
        .target(
            name: "BlobWriterPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "GCDWebServers", package: "GCDWebServer")
            ],
            path: "ios/Plugin/Swift"
        )
    ]
)
