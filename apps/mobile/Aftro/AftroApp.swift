import ARKit
import AVFoundation
import SwiftUI
import UIKit
import VisionKit

@main
struct AftroApp: App {
    var body: some Scene { WindowGroup { Home() } }
}

private let orange = Color(red: 1, green: 0.34, blue: 0.12)
private let linen = Color(red: 0.969, green: 0.953, blue: 0.93)
private let ink = Color(red: 0.12, green: 0.10, blue: 0.09)

private struct MainButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label.font(.system(size: 16, weight: .semibold))
            .frame(maxWidth: .infinity, minHeight: 49).padding(.horizontal, 8)
            .foregroundStyle(ink)
            .background(orange.opacity(configuration.isPressed ? 0.75 : 1), in: RoundedRectangle(cornerRadius: 13))
    }
}

private struct Photo: View {
    let name: String
    private static let photos = Dictionary(uniqueKeysWithValues: ["room-warm", "room-light", "room-before"].compactMap { name -> (String, UIImage)? in
        guard let url = Bundle.main.url(forResource: name, withExtension: "jpg"),
              let image = UIImage(contentsOfFile: url.path) else { return nil }
        return (name, image)
    })

    var body: some View {
        GeometryReader { geometry in
            if let photo = Self.photos[name] {
                Image(uiImage: photo).resizable().scaledToFill()
                    .frame(width: geometry.size.width, height: geometry.size.height).clipped()
            } else { Rectangle().fill(linen) }
        }
    }
}

private enum Screen: Hashable { case compare, camera }
private enum Panel: String, Identifiable {
    case scan, settings, account
    var id: String { rawValue }
}

private struct Home: View {
    @AppStorage("aftro.language") private var languageID = "kk"
    @AppStorage("aftro.server") private var server = ""
    @StateObject private var model = AftroModel()
    @State private var path: [Screen] = []
    @State private var panel: Panel?
    @Environment(\.openURL) private var openURL
    private var l: Language { Language(rawValue: languageID) ?? .kk }

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    HStack {
                        Text(model.apartment.slug == Apartment.demo.slug
                             ? l.text("Demo apartment", "Демо пәтер", "Демо-квартира") : model.apartment.name)
                            .font(.caption.weight(.bold)).textCase(.uppercase).tracking(1.3)
                            .foregroundStyle(Color(red: 0.56, green: 0.18, blue: 0))
                        Spacer()
                        Button { panel = .scan } label: { Image(systemName: "qrcode.viewfinder").font(.title2) }
                            .accessibilityLabel(l.text("Scan QR", "QR-код оқу", "Сканировать QR"))
                    }
                    Text(l.text("See it finished.", "Үйіңді дайын күйінде көр.", "Увидь квартиру после ремонта."))
                        .font(.system(size: 39, weight: .heavy)).tracking(-2.4)
                        .accessibilityAddTraits(.isHeader)
                    Text(l.text("Compare finishes and view the result in the room.", "Жөндеу нұсқаларын салыстыр да, нәтижені бөлмеде көр.", "Сравни отделку и посмотри результат в комнате."))
                        .font(.subheadline).foregroundStyle(.secondary)
                    Photo(name: model.finish.photo).frame(height: 286)
                        .clipShape(RoundedRectangle(cornerRadius: 19))
                        .accessibilityLabel(l.finish(model.finish))
                    HStack {
                        Text(model.apartment.slug == Apartment.demo.slug ? l.text("Living room", "Қонақ бөлме", "Гостиная") : model.apartment.name)
                            .font(.title2.bold())
                        Spacer()
                        Text("\(model.apartment.width * model.apartment.depth, format: .number.precision(.fractionLength(1))) m²")
                            .font(.subheadline.weight(.semibold))
                    }
                    Button { path.append(.compare) } label: {
                        Label(l.text("Compare finishes", "Жөндеуді салыстыру", "Сравнить отделку"), systemImage: "rectangle.split.2x1")
                    }.buttonStyle(MainButton())
                    Button { path.append(.camera) } label: {
                        Label(l.text("Open AR camera", "AR камераны ашу", "Открыть AR-камеру"), systemImage: "camera.viewfinder")
                            .frame(maxWidth: .infinity)
                    }.buttonStyle(.bordered).controlSize(.large)
                    if let api = try? API(server) {
                        Button { openURL(api.origin.appendingPathComponent("preview").appendingPathComponent("vr.html")) } label: {
                            Label(l.text("3D & VR tour", "3D және VR тур", "3D- и VR-тур"), systemImage: "view.3d").frame(maxWidth: .infinity)
                        }.buttonStyle(.bordered).controlSize(.large)
                    }
                }.padding(20).frame(maxWidth: 565).frame(maxWidth: .infinity)
            }
            .background(linen)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 8) {
                        ZStack {
                            Capsule().fill(orange).frame(width: 24, height: 9).rotationEffect(.degrees(10)).offset(x: 4, y: -6)
                            Capsule().fill(orange).frame(width: 24, height: 9).rotationEffect(.degrees(10)).offset(x: -4, y: 6)
                        }.frame(width: 32, height: 28).accessibilityHidden(true)
                        Text("AFTRO").font(.system(size: 24, weight: .black)).tracking(-1.7)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { panel = .account } label: {
                        Image(systemName: model.profile == nil ? "person.crop.circle" : "person.crop.circle.fill")
                    }.accessibilityLabel(l.text("Account", "Аккаунт", "Аккаунт"))
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { panel = .settings } label: { Image(systemName: "gearshape") }
                        .accessibilityLabel(l.text("Settings", "Баптау", "Настройки"))
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .navigationDestination(for: Screen.self) { screen in
                switch screen {
                case .compare: Comparison(model: model, l: l)
                case .camera: CameraScreen(apartment: model.apartment, initial: model.finish, l: l)
                }
            }
            .sheet(item: $panel) { value in
                switch value {
                case .settings: Settings(languageID: $languageID, server: $server)
                case .account: Account(model: model, l: l)
                case .scan:
                    Scan(model: model, l: l) {
                        panel = nil
                        path.append(.compare)
                    }
                }
            }
        }
        .task(id: server) { await model.configure(server) }
        .foregroundStyle(ink).tint(ink).preferredColorScheme(.light)
        .environment(\.locale, Locale(identifier: languageID))
    }
}

private struct Comparison: View {
    @ObservedObject var model: AftroModel
    let l: Language
    @State private var ratio: Double = 0.52
    @State private var message = ""
    @State private var busy = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                GeometryReader { size in
                    let split = size.size.width * ratio
                    ZStack(alignment: .leading) {
                        Photo(name: "room-before")
                        Photo(name: model.finish.photo)
                            .mask(alignment: .trailing) { Rectangle().frame(width: size.size.width - split) }
                        Rectangle().fill(.white).frame(width: 2).offset(x: split - 1)
                        HStack {
                            badge(l.text("Before", "Дейін", "До"))
                            Spacer()
                            badge(l.text("After", "Кейін", "После"))
                        }.padding(9).frame(maxHeight: .infinity, alignment: .top)
                    }
                }.frame(height: 390).clipShape(RoundedRectangle(cornerRadius: 19))
                Slider(value: $ratio).tint(orange)
                    .accessibilityLabel(l.text("Before and after", "Дейінгі және кейінгі көрініс", "До и после"))
                Picker(l.text("Finish", "Жөндеу нұсқасы", "Отделка"), selection: $model.selected) {
                    ForEach(model.apartment.finishes) { finish in Text(l.finish(finish)).tag(finish.slug) }
                }.pickerStyle(.segmented)
                Button {
                    busy = true
                    Task {
                        do { try await model.save(); message = l.text("Finish saved.", "Нұсқа сақталды.", "Вариант сохранён.") }
                        catch { message = l.message(error) }
                        busy = false
                    }
                } label: { Label(l.text("Save finish", "Нұсқаны сақтау", "Сохранить отделку"), systemImage: "bookmark") }
                    .buttonStyle(MainButton()).disabled(busy)
                if !message.isEmpty { Text(message).font(.footnote).foregroundStyle(.secondary) }
            }.padding(20).frame(maxWidth: 565).frame(maxWidth: .infinity)
        }.background(linen)
        .navigationTitle(l.text("Compare finishes", "Жөндеуді салыстыру", "Сравнить отделку"))
        .navigationBarTitleDisplayMode(.inline)
    }

    func badge(_ text: String) -> some View {
        Text(text).font(.caption.bold()).padding(6).foregroundStyle(.white)
            .background(Color.black.opacity(0.72), in: RoundedRectangle(cornerRadius: 6))
    }
}

private struct CameraScreen: View {
    let apartment: Apartment
    let initial: Finish
    let l: Language
    @State private var selection: String
    @State private var permitted = false
    @State private var step = 0
    @State private var reset = 0

    init(apartment: Apartment, initial: Finish, l: Language) {
        self.apartment = apartment
        self.initial = initial
        self.l = l
        _selection = State(initialValue: initial.slug)
    }

    private var finishes: [Finish] { [.bare] + apartment.finishes }
    private var canUseCamera: Bool { permitted && apartment.canPlace && ARWorldTrackingConfiguration.isSupported }

    private var instruction: String {
        guard canUseCamera else {
            return l.text("Use a compatible iPhone with camera access and a supported room plan.", "AR үшін үйлесімді iPhone, камераға рұқсат және бөлме жоспары керек.", "Для AR нужны совместимый iPhone, доступ к камере и поддерживаемый план.")
        }
        switch step {
        case 0: return l.text("Aim at the floor and tap the left corner of the back wall.", "Еденге бағыттап, артқы қабырғаның сол жақ бұрышын бас.", "Наведи на пол и нажми на левый угол дальней стены.")
        case 1: return l.text("Tap a second point to the right on the same wall.", "Сол қабырға бойынан оңға қарай екінші нүктені бас.", "Отметь вторую точку справа вдоль той же стены.")
        default: return l.text("Move the phone and switch finishes below.", "Телефонды қозғап, жөндеуді төменнен ауыстыр.", "Двигай телефон и меняй отделку внизу.")
        }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                if canUseCamera {
                    RoomCamera(apartment: apartment, finish: finishes.first { $0.slug == selection } ?? initial,
                               reset: reset, changeStep: { step = $0 })
                } else { Photo(name: initial.photo) }
            }.ignoresSafeArea(edges: .bottom)
            VStack(spacing: 10) {
                Text(instruction).font(.subheadline.weight(.semibold)).frame(maxWidth: .infinity, alignment: .leading)
                Picker(l.text("Finish", "Жөндеу нұсқасы", "Отделка"), selection: $selection) {
                    ForEach(finishes) { finish in Text(l.finish(finish)).tag(finish.slug) }
                }.pickerStyle(.segmented)
                Button(l.text("Reset alignment", "Қайта туралау", "Сбросить выравнивание")) { step = 0; reset += 1 }
                    .font(.footnote.weight(.semibold)).disabled(step == 0)
            }.padding(14).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16)).padding(16)
        }
        .navigationTitle(l.text("AR camera", "AR камера", "AR-камера"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if apartment.canPlace && ARWorldTrackingConfiguration.isSupported {
                permitted = await AVCaptureDevice.requestAccess(for: .video)
            }
        }
    }
}

private struct Settings: View {
    @Binding var languageID: String
    @Binding var server: String
    @State private var draft = ""
    @State private var invalid = false
    @Environment(\.dismiss) private var dismiss
    private var l: Language { Language(rawValue: languageID) ?? .kk }

    var body: some View {
        NavigationStack {
            Form {
                Picker(l.text("Language", "Тіл", "Язык"), selection: $languageID) {
                    ForEach(Language.allCases) { language in Text(language.label).tag(language.rawValue) }
                }
                Section {
                    TextField(l.text("Server address", "Сервер адресі", "Адрес сервера"), text: $draft)
                        .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button(l.text("Apply", "Қолдану", "Применить")) {
                        let value = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        if value.isEmpty || (try? API(value)) != nil { server = value; dismiss() }
                        else { invalid = true }
                    }
                } footer: {
                    Text(invalid ? l.message(ServerError.address) :
                         l.text("Connect your server for accounts and the VR tour.", "Аккаунт пен VR тур үшін серверді қос.", "Подключи сервер для аккаунта и VR-тура."))
                }
            }
            .navigationTitle(l.text("Settings", "Баптау", "Настройки"))
            .toolbar { Button(l.text("Close", "Жабу", "Закрыть")) { dismiss() } }
            .onAppear { draft = server }
        }
    }
}

private struct Scan: View {
    @ObservedObject var model: AftroModel
    let l: Language
    let success: () -> Void
    @State private var text = ""
    @State private var message = ""
    @State private var scanning = false
    @State private var busy = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                if scanning {
                    QRReader(result: open, unavailable: { scanning = false })
                        .frame(minHeight: 210).clipShape(RoundedRectangle(cornerRadius: 17))
                } else {
                    Photo(name: "room-before").frame(height: 244)
                        .clipShape(RoundedRectangle(cornerRadius: 17))
                }
                TextField(l.text("Apartment code", "Пәтер коды", "Код квартиры"), text: $text)
                    .textFieldStyle(.roundedBorder).autocorrectionDisabled().textInputAutocapitalization(.never)
                Button(l.text("Open apartment", "Пәтерді ашу", "Открыть квартиру")) { open(text) }
                    .buttonStyle(MainButton()).disabled(busy)
                if !message.isEmpty { Text(message).font(.footnote) }
            }.padding(20)
            .navigationTitle(l.text("Scan apartment QR", "Пәтердің QR-кодын оқу", "Сканировать QR квартиры"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button(l.text("Close", "Жабу", "Закрыть")) { dismiss() } }
            .task {
                if DataScannerViewController.isSupported {
                    let allowed = await AVCaptureDevice.requestAccess(for: .video)
                    scanning = allowed && DataScannerViewController.isAvailable
                }
            }
        }
    }

    private func open(_ raw: String) {
        guard !busy else { return }
        guard let slug = apartmentSlug(raw) else {
            message = l.text("Check the apartment code.", "Пәтер кодын тексер.", "Проверь код квартиры.")
            return
        }
        text = slug
        busy = true
        Task {
            do { try await model.open(slug); success() }
            catch { message = l.message(error); scanning = false }
            busy = false
        }
    }
}

private struct Account: View {
    @ObservedObject var model: AftroModel
    let l: Language
    @Environment(\.dismiss) private var dismiss
    @State private var register = false
    @State private var phone = true
    @State private var id = ""
    @State private var password = ""
    @State private var code = ""
    @State private var message = ""
    @State private var busy = false

    var body: some View {
        NavigationStack {
            Form {
                if let profile = model.profile {
                    Section {
                        Text(profile.identifier).font(.headline).textSelection(.enabled)
                        Text(l.text("Saved finishes are linked to your account.", "Нұсқалар аккаунтыңа сақталады.", "Сохранённые варианты привязаны к аккаунту.")).font(.footnote)
                        Button(l.text("Sign out", "Шығу", "Выйти"), role: .destructive) { run { try await model.logout() } }
                    }
                } else {
                    Section {
                        Picker(l.text("Mode", "Режим", "Режим"), selection: $register) {
                            Text(l.text("Sign in", "Кіру", "Войти")).tag(false)
                            Text(l.text("Register", "Тіркелу", "Регистрация")).tag(true)
                        }.pickerStyle(.segmented)
                        Picker(l.text("Account type", "Аккаунт түрі", "Тип аккаунта"), selection: $phone) {
                            Text(l.text("Phone number", "Телефон нөмірі", "Номер телефона")).tag(true)
                            Text("Email").tag(false)
                        }.pickerStyle(.segmented)
                        TextField(phone ? "+7 700 000 00 00" : "name@example.com", text: $id)
                            .keyboardType(phone ? .phonePad : .emailAddress)
                            .textContentType(.username).textInputAutocapitalization(.never).autocorrectionDisabled()
                        SecureField(l.text("Password", "Пароль", "Пароль"), text: $password)
                            .textContentType(register ? .newPassword : .password)
                        if register && phone {
                            HStack {
                                TextField(l.text("SMS code", "SMS код", "Код из SMS"), text: $code)
                                    .keyboardType(.numberPad).textContentType(.oneTimeCode)
                                Button(l.text("Send code", "Код жіберу", "Отправить код")) {
                                    run {
                                        try await model.sendCode(id)
                                        message = l.text("Code sent.", "Код жіберілді.", "Код отправлен.")
                                    }
                                }.buttonStyle(.borderless).disabled(id.isEmpty)
                            }
                        }
                        Button(register ? l.text("Register", "Тіркелу", "Регистрация") : l.text("Sign in", "Кіру", "Войти")) {
                            run {
                                try await model.authenticate(id, password, code: register && phone ? code : nil, register: register)
                                password = ""
                                code = ""
                            }
                        }.buttonStyle(MainButton())
                        .disabled(id.isEmpty || password.isEmpty || (register && phone && code.isEmpty))
                    }
                }
                if !message.isEmpty { Text(message).font(.footnote) }
            }.disabled(busy)
            .navigationTitle(l.text("Account", "Аккаунт", "Аккаунт"))
            .toolbar { Button(l.text("Close", "Жабу", "Закрыть")) { dismiss() } }
            .onChange(of: phone) { _, _ in id = ""; code = ""; message = "" }
        }
    }

    private func run(_ action: @escaping () async throws -> Void) {
        guard !busy else { return }
        message = ""
        busy = true
        Task {
            do { try await action() }
            catch { message = l.message(error) }
            busy = false
        }
    }
}
