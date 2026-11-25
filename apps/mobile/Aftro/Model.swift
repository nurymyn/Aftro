import Foundation
import SwiftUI

enum Language: String, CaseIterable, Identifiable {
    case kk, ru, en
    var id: String { rawValue }
    var label: String { text("English", "Қазақша", "Русский") }
    func text(_ english: String, _ kazakh: String, _ russian: String) -> String {
        switch self {
        case .en: return english
        case .kk: return kazakh
        case .ru: return russian
        }
    }

    func finish(_ finish: Finish) -> String {
        switch finish.slug {
        case "warm": return text("Warm Oak", "Жылы реңк", "Тёплый тон")
        case "light": return text("Soft Light", "Ашық реңк", "Светлый тон")
        case "before": return text("Unfinished", "Черновой", "Черновая")
        default: return finish.name
        }
    }

    func message(_ error: Error) -> String {
        guard let error = error as? ServerError else { return text("Request failed. Try again.", "Әрекет орындалмады. Қайта көр.", "Запрос не удался. Попробуй снова.") }
        switch error {
        case .address: return text("Set the Aftro server address first.", "Алдымен Aftro серверінің адресін енгіз.", "Сначала укажи адрес сервера Aftro.")
        case .response("incorrect_credentials"): return text("Check your login and password.", "Логин мен парольді тексер.", "Проверь логин и пароль.")
        case .response("short_password"): return text("Use at least 15 characters.", "Кемінде 15 таңба қолдан.", "Введи минимум 15 символов.")
        case .response("invalid_code"), .response("missing_code"): return text("Check the SMS code.", "SMS кодты тексер.", "Проверь код из SMS.")
        case .response("sms_unavailable"): return text("SMS is unavailable. You can register by email.", "SMS қолжетімсіз. Email арқылы тіркеле аласың.", "SMS недоступно. Можно зарегистрироваться по email.")
        case .response("account_exists"): return text("This account already exists. Sign in.", "Аккаунт бар. Кіріп көр.", "Аккаунт уже существует. Войди в него.")
        case .response("too_many_attempts"): return text("Too many attempts. Try again later.", "Әрекет тым көп болды. Кейін қайтала.", "Слишком много попыток. Попробуй позже.")
        default: return text("Request failed. Try again.", "Әрекет орындалмады. Қайта көр.", "Запрос не удался. Попробуй снова.")
        }
    }
}

struct Finish: Codable, Identifiable {
    let slug: String
    let name: String
    var id: String { slug }
    var photo: String { slug == "light" ? "room-light" : slug == "before" ? "room-before" : "room-warm" }
    static let bare = Finish(slug: "before", name: "Unfinished")
    static let warm = Finish(slug: "warm", name: "Warm Oak")
}

struct Apartment: Decodable {
    let slug: String
    let name: String
    let width: Double
    let depth: Double
    let height: Double
    let finishes: [Finish]
    enum CodingKeys: String, CodingKey {
        case slug, name, finishes
        case width = "width_m"
        case depth = "length_m"
        case height = "height_m"
    }
    static let demo = Apartment(slug: "demo-apartment", name: "Living room", width: 4.5, depth: 3.6, height: 2.8,
                                finishes: [.warm, Finish(slug: "light", name: "Soft Light")])
    var canPlace: Bool { width >= 1.2 && width <= 25 && depth >= 1.2 && depth <= 25 && height >= 1.6 && height <= 8 }
}

struct Profile: Decodable { let identifier: String }
private struct Saved: Decodable {
    let finishSlug: String?
    enum CodingKeys: String, CodingKey { case finishSlug = "finish_slug" }
}
private struct Failure: Decodable { let detail: String }
enum ServerError: Error { case address, response(String) }

struct API {
    let origin: URL
    init(_ raw: String) throws {
        guard var parts = URLComponents(string: raw.trimmingCharacters(in: .whitespacesAndNewlines)),
              let host = parts.host?.lowercased(), !host.isEmpty, parts.user == nil, parts.password == nil
        else { throw ServerError.address }
        let fields = host.split(separator: ".", omittingEmptySubsequences: false)
        let octets = fields.compactMap { UInt8($0) }
        let privateIP = fields.count == 4 && octets.count == 4
            && (octets[0] == 10 || octets[0] == 127 || (octets[0] == 192 && octets[1] == 168)
            || (octets[0] == 172 && (16...31).contains(octets[1])))
        let local = privateIP || host == "localhost" || host.hasSuffix(".local")
        guard parts.scheme?.lowercased() == "https" || (parts.scheme?.lowercased() == "http" && local)
        else { throw ServerError.address }
        parts.path = ""
        parts.query = nil
        parts.fragment = nil
        guard let url = parts.url else { throw ServerError.address }
        origin = url
    }

    func request(_ path: String, method: String = "GET", fields: [String: String]? = nil) async throws -> Data {
        let url = path.split(separator: "/").reduce(origin) { $0.appendingPathComponent(String($1)) }
        var req = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 14)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let fields {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONEncoder().encode(fields)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let response = response as? HTTPURLResponse else { throw ServerError.response("connection") }
        guard (200..<300).contains(response.statusCode) else {
            let problem = try? JSONDecoder().decode(Failure.self, from: data)
            throw ServerError.response(problem?.detail ?? "connection")
        }
        return data
    }

    func decoded<T: Decodable>(_ type: T.Type, _ path: String, method: String = "GET", fields: [String: String]? = nil) async throws -> T {
        try JSONDecoder().decode(type, from: await request(path, method: method, fields: fields))
    }
}

func apartmentSlug(_ raw: String) -> String? {
    let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
    let parts = URLComponents(string: text)
    let path = parts?.path.split(separator: "/").map(String.init) ?? []
    let fromPath = path.count >= 2 && ["apartment", "apartments"].contains(path[path.count - 2])
    let code = parts?.queryItems?.first(where: { $0.name == "apartment" })?.value
        ?? ((fromPath || (parts?.scheme == "aftro" && parts?.host == "apartment")) ? path.last : nil)
        ?? text
    guard code.range(of: "^[A-Za-z0-9][A-Za-z0-9-]{0,79}$", options: .regularExpression) != nil else { return nil }
    return code.lowercased()
}

@MainActor final class AftroModel: ObservableObject {
    @Published private(set) var apartment = Apartment.demo
    @Published private(set) var profile: Profile?
    @Published var selected = "warm"
    private(set) var api: API?
    private var address = ""

    var finish: Finish { apartment.finishes.first { $0.slug == selected } ?? apartment.finishes.first ?? .warm }

    func configure(_ address: String) async {
        if self.address != address {
            self.address = address
            apartment = .demo
            profile = nil
        }
        api = try? API(address)
        if let api {
            let remote = try? await api.decoded(Apartment.self, "api/v1/apartments/" + apartment.slug)
            let account = try? await api.decoded(Profile.self, "api/v1/auth/me")
            guard self.address == address else { return }
            if let remote, !remote.finishes.isEmpty { apartment = remote }
            profile = account
        }
        await restore()
    }

    func open(_ slug: String) async throws {
        if slug == Apartment.demo.slug {
            apartment = (try? await api?.decoded(Apartment.self, "api/v1/apartments/" + slug)) ?? .demo
        } else {
            let result = try await client().decoded(Apartment.self, "api/v1/apartments/" + slug)
            guard !result.finishes.isEmpty else { throw ServerError.response("empty") }
            apartment = result
        }
        await restore()
    }

    func save() async throws {
        if profile != nil {
            _ = try await client().request("api/v1/auth/finishes/" + apartment.slug, method: "PUT", fields: ["finish_slug": finish.slug])
        } else {
            UserDefaults.standard.set(finish.slug, forKey: "aftro.finish." + apartment.slug)
        }
    }

    func authenticate(_ id: String, _ password: String, code: String?, register: Bool) async throws {
        var fields = ["identifier": id, "password": password]
        if let code { fields["code"] = code }
        profile = try await client().decoded(Profile.self, "api/v1/auth/" + (register ? "register" : "login"), method: "POST", fields: fields)
        await restore()
    }

    func sendCode(_ phone: String) async throws {
        _ = try await client().request("api/v1/auth/phone-code", method: "POST", fields: ["phone": phone])
    }

    func logout() async throws {
        _ = try await client().request("api/v1/auth/logout", method: "POST", fields: [:])
        profile = nil
        await restore()
    }

    private func client() throws -> API {
        guard let api else { throw ServerError.address }
        return api
    }

    private func restore() async {
        let slug = apartment.slug
        let finish: String?
        if let api, profile != nil {
            finish = (try? await api.decoded(Saved.self, "api/v1/auth/finishes/" + slug))?.finishSlug
        } else {
            finish = UserDefaults.standard.string(forKey: "aftro.finish." + slug)
        }
        guard apartment.slug == slug else { return }
        selected = apartment.finishes.first { $0.slug == finish }?.slug ?? apartment.finishes.first?.slug ?? "warm"
    }
}
