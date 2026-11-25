import ARKit
import RealityKit
import SwiftUI
import simd
import UIKit
import VisionKit

struct RoomCamera: UIViewRepresentable {
    let apartment: Apartment
    let finish: Finish
    let reset: Int
    let changeStep: (Int) -> Void

    func makeCoordinator() -> Coordinator { Coordinator(input: self) }

    func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal]
        view.session.run(configuration)
        let coach = ARCoachingOverlayView()
        coach.session = view.session
        coach.goal = .horizontalPlane
        coach.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        coach.frame = view.bounds
        view.addSubview(coach)
        view.addGestureRecognizer(UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.place(_:))))
        return view
    }

    func updateUIView(_ view: ARView, context: Context) {
        let coordinator = context.coordinator
        if reset != coordinator.input.reset {
            if let anchor = coordinator.anchor { view.scene.removeAnchor(anchor) }
            coordinator.anchor = nil
            coordinator.first = nil
        }
        coordinator.input = self
        coordinator.render()
    }

    static func dismantleUIView(_ view: ARView, coordinator: Coordinator) { view.session.pause() }

    @MainActor final class Coordinator: NSObject {
        var input: RoomCamera
        var first: SIMD3<Float>?
        var anchor: AnchorEntity?
        private var visibleFinish = ""
        init(input: RoomCamera) { self.input = input }

        @objc func place(_ gesture: UITapGestureRecognizer) {
            guard anchor == nil, let view = gesture.view as? ARView,
                  let hit = view.raycast(from: gesture.location(in: view), allowing: .existingPlaneGeometry, alignment: .horizontal).first
            else { return }
            let p = hit.worldTransform.columns.3
            let point = SIMD3(p.x, p.y, p.z)
            guard let first else { self.first = point; input.changeStep(1); return }
            let axis = point - first
            guard simd_length(SIMD2(axis.x, axis.z)) > 0.35, abs(axis.y) <= 0.12 else { return }
            let root = AnchorEntity(world: first)
            root.orientation = simd_quatf(angle: atan2(-axis.z, axis.x), axis: SIMD3(0, 1, 0))
            view.scene.addAnchor(root)
            anchor = root
            visibleFinish = ""
            render()
            input.changeStep(2)
        }

        func render() {
            guard let anchor, visibleFinish != input.finish.slug else { return }
            visibleFinish = input.finish.slug
            for child in Array(anchor.children) { child.removeFromParent() }
            let w = Float(input.apartment.width), d = Float(input.apartment.depth), h = Float(input.apartment.height)
            let warm = visibleFinish == "warm", bare = visibleFinish == "before"
            let floor: UInt32 = bare ? 0xA49D96 : warm ? 0xA57A54 : 0xD7BE99
            let wall: UInt32 = bare ? 0xB7AEA6 : warm ? 0xDCC8B4 : 0xF0E8DD
            let fabric: UInt32 = warm ? 0xAA8971 : 0xE0D1BC
            func box(_ name: String, _ size: SIMD3<Float>, _ center: SIMD3<Float>, _ color: UInt32, radius: Float = 0) {
                let paint = UIColor(red: CGFloat((color >> 16) & 255) / 255, green: CGFloat((color >> 8) & 255) / 255,
                                    blue: CGFloat(color & 255) / 255, alpha: 1)
                let material = SimpleMaterial(color: paint, roughness: 0.8, isMetallic: false)
                let object = ModelEntity(mesh: MeshResource.generateBox(size: size, cornerRadius: radius), materials: [material])
                object.name = name
                object.position = center
                anchor.addChild(object)
            }

            box("Floor", [w, 0.012, d], [w/2, 0.006, d/2], floor)
            box("Back wall", [w, h, 0.025], [w/2, h/2, 0.018], wall)
            guard !bare else { return }
            for index in 1..<max(1, Int(d/0.18)) { box("Plank seam", [w, 0.001, 0.003], [w/2, 0.013, Float(index)*0.18], warm ? 0x785438 : 0xC6AB85) }
            let center = w/2, sofa = min(w-0.35, 2.65)
            box("Rug", [min(w*0.78, 2.6), 0.012, min(d*0.55, 1.8)], [center, 0.019, d*0.47], 0xD9CABB)
            box("Sofa seat", [sofa, 0.32, 0.77], [center, 0.24, 0.52], fabric, radius: 0.06)
            box("Sofa back", [sofa, 0.52, 0.19], [center, 0.61, 0.21], fabric, radius: 0.05)
            for side in [Float(-1), Float(1)] {
                box("Sofa arm", [0.19, 0.31, 0.72], [center+side*(sofa/2-0.10), 0.46, 0.51], fabric, radius: 0.06)
                box("Cushion", [0.34, 0.31, 0.13], [center+side*sofa/3, 0.55, 0.34], 0xEFE0CA, radius: 0.04)
            }
            let wood: UInt32 = warm ? 0x62422D : 0xAE916C
            box("Table", [min(w*0.37, 1.15), 0.07, 0.49], [center, 0.36, d*0.43], wood, radius: 0.03)
            box("Table base", [0.34, 0.32, 0.26], [center, 0.19, d*0.43], wood, radius: 0.025)
        }
    }
}

struct QRReader: UIViewControllerRepresentable {
    let result: (String) -> Void
    let unavailable: () -> Void

    func makeCoordinator() -> ScannerDelegate { ScannerDelegate(result: result, unavailable: unavailable) }

    func makeUIViewController(context: Context) -> ScannerHost {
        let scanner = DataScannerViewController(recognizedDataTypes: [.barcode(symbologies: [.qr])], qualityLevel: .balanced,
                                               recognizesMultipleItems: false, isHighFrameRateTrackingEnabled: false,
                                               isPinchToZoomEnabled: true, isGuidanceEnabled: true, isHighlightingEnabled: true)
        scanner.delegate = context.coordinator
        return ScannerHost(scanner: scanner, unavailable: unavailable)
    }

    func updateUIViewController(_ host: ScannerHost, context: Context) {}
    static func dismantleUIViewController(_ host: ScannerHost, coordinator: ScannerDelegate) { host.scanner.stopScanning() }

    final class ScannerHost: UIViewController {
        let scanner: DataScannerViewController
        let unavailable: () -> Void
        init(scanner: DataScannerViewController, unavailable: @escaping () -> Void) {
            self.scanner = scanner
            self.unavailable = unavailable
            super.init(nibName: nil, bundle: nil)
        }
        @available(*, unavailable) required init?(coder: NSCoder) { fatalError() }
        override func viewDidLoad() {
            super.viewDidLoad()
            addChild(scanner)
            scanner.view.frame = view.bounds
            scanner.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            view.addSubview(scanner.view)
            scanner.didMove(toParent: self)
        }
        override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            do { try scanner.startScanning() } catch { unavailable() }
        }
        override func viewWillDisappear(_ animated: Bool) {
            scanner.stopScanning()
            super.viewWillDisappear(animated)
        }
    }

    final class ScannerDelegate: NSObject, DataScannerViewControllerDelegate {
        let result: (String) -> Void
        let unavailable: () -> Void
        private var sent = false
        init(result: @escaping (String) -> Void, unavailable: @escaping () -> Void) {
            self.result = result
            self.unavailable = unavailable
        }
        func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
            guard !sent else { return }
            for item in addedItems {
                if case .barcode(let barcode) = item, let text = barcode.payloadStringValue, let code = apartmentSlug(text) {
                    sent = true
                    dataScanner.stopScanning()
                    result(code)
                    break
                }
            }
        }
        func dataScanner(_ dataScanner: DataScannerViewController, becameUnavailableWithError error: DataScannerViewController.ScanningUnavailable) {
            unavailable()
        }
    }
}
