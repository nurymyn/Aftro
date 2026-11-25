export const copy = {
  kk: {
    apartment: 'Пәтер', camera: 'Камера', tour: '3D тур', settings: 'Баптаулар',
    language: 'Интерфейс тілі', live: 'Тікелей камера', scan: 'QR сканерлеу',
    cameraAccess: 'Бөлмені көру және пәтер кодын сканерлеу үшін камераға рұқсат бер.',
    allowCamera: 'Камераға рұқсат беру', openSettings: 'Телефон баптаулары',
    aim: 'Пәтердің QR кодын жақтау ішіне жазық ұстап көрсет.',
    scanError: 'Бұл QR Aftro-ның демо пәтеріне тиесілі емес.',
    scanAgain: 'Қайта сканерлеу', liveNote: 'Дизайн салыстыру үшін «Пәтер» бөліміне өт.',
    server: 'Aftro сервері', address: 'Сервер мекенжайы',
    serverHelp: 'Тіркелу, кіру және таңдаған дизайнды аккаунтқа сақтау үшін серверді қос.',
    invalidAddress: 'HTTPS мекенжайын немесе жергілікті Wi-Fi IP мекенжайын енгіз.',
    unreachable: 'Сервер ашылмады. Wi-Fi мен мекенжайды тексер.',
    connected: 'Сервер қосылды', offline: 'Демо режимі',
    connect: 'Қосу', connecting: 'Қосылып жатыр…', disconnect: 'Демо режиміне оралу',
  },
  ru: {
    apartment: 'Квартира', camera: 'Камера', tour: '3D-тур', settings: 'Настройки',
    language: 'Язык интерфейса', live: 'Прямая камера', scan: 'Сканировать QR',
    cameraAccess: 'Разреши доступ к камере, чтобы смотреть помещение и сканировать код квартиры.',
    allowCamera: 'Разрешить камеру', openSettings: 'Настройки телефона',
    aim: 'Помести QR-код квартиры в рамку.',
    scanError: 'Этот QR-код не относится к демо-квартире Aftro.',
    scanAgain: 'Сканировать снова', liveNote: 'Сравнение вариантов отделки доступно в разделе «Квартира».',
    server: 'Сервер Aftro', address: 'Адрес сервера',
    serverHelp: 'Подключи сервер для регистрации, входа и сохранения отделки в аккаунте.',
    invalidAddress: 'Введи адрес HTTPS или локальный IP-адрес Wi-Fi.',
    unreachable: 'Сервер недоступен. Проверь Wi-Fi и адрес.',
    connected: 'Сервер подключён', offline: 'Демо-режим',
    connect: 'Подключиться', connecting: 'Подключение…', disconnect: 'Вернуться в демо',
  },
  en: {
    apartment: 'Apartment', camera: 'Camera', tour: '3D tour', settings: 'Settings',
    language: 'Interface language', live: 'Live camera', scan: 'Scan QR',
    cameraAccess: 'Allow camera access to view the room and scan apartment codes.',
    allowCamera: 'Allow camera access', openSettings: 'Open phone settings',
    aim: 'Place the apartment QR code inside the frame.',
    scanError: 'This QR code does not belong to the Aftro demo apartment.',
    scanAgain: 'Scan again', liveNote: 'Open Apartment to compare renovation finishes.',
    server: 'Aftro server', address: 'Server address',
    serverHelp: 'Connect the server to register, sign in, and save finishes to your account.',
    invalidAddress: 'Enter an HTTPS address or a local Wi-Fi IP address.',
    unreachable: 'The server is unavailable. Check Wi-Fi and the address.',
    connected: 'Server connected', offline: 'Demo mode',
    connect: 'Connect', connecting: 'Connecting…', disconnect: 'Return to demo',
  },
};

export type Language = keyof typeof copy;
export const languages: { id: Language; name: string }[] = [
  { id: 'kk', name: 'Қазақша' },
  { id: 'ru', name: 'Русский' },
  { id: 'en', name: 'English' },
];

export function isLanguage(value: unknown): value is Language {
  return value === 'kk' || value === 'ru' || value === 'en';
}
