(() => {
  const copy = {
  "en": {
    "account": "Account",
    "close": "Close",
    "login": "Sign in",
    "signup": "Create account",
    "email": "Email",
    "phone": "Phone number",
    "method": "Sign in with",
    "password": "Password",
    "show": "Show",
    "hide": "Hide",
    "code": "SMS code",
    "send": "Send code",
    "signout": "Sign out",
    "phoneNote": "Enter the number with its country code, for example +7.",
    "newPasswordNote": "Use at least 15 characters.",
    "profile": "Your account",
    "profileNote": "Saved finishes are available when you sign in again.",
    "sent": "SMS code sent.",
    "savedAccount": "{finish} saved to your account.",
    "accountSaveFailed": "Couldn't save the finish to your account. Try again.",
    "invalid_identifier": "Enter a valid email or a phone number with its country code.",
    "short_password": "Use at least 15 characters.",
    "missing_code": "Enter the SMS code to register.",
    "invalid_code": "The code is incorrect or expired. Request another code.",
    "account_exists": "An account already uses these details. Try signing in.",
    "incorrect_credentials": "The email, phone number or password is incorrect.",
    "sms_unavailable": "SMS verification is unavailable right now. You can register with email.",
    "sms_failed": "Couldn't send or verify an SMS code. Try again shortly.",
    "too_many_attempts": "Too many attempts. Try again in 10 minutes.",
    "accounts_unavailable": "Accounts require the Aftro server. Open the preview from the running app.",
    "invalid_form": "Check the fields and try again."
  },
  "kk": {
    "account": "Аккаунт",
    "close": "Жабу",
    "login": "Кіру",
    "signup": "Тіркелу",
    "email": "Email",
    "phone": "Телефон нөмірі",
    "method": "Кіру тәсілі",
    "password": "Пароль",
    "show": "Көрсету",
    "hide": "Жасыру",
    "code": "SMS код",
    "send": "Код жіберу",
    "signout": "Шығу",
    "phoneNote": "Нөмірді ел кодымен енгіз, мысалы +7.",
    "newPasswordNote": "Кемінде 15 таңба енгіз.",
    "profile": "Аккаунтың",
    "profileNote": "Келесі жолы кіргенде сақтаған нұсқаңды көресің.",
    "sent": "SMS код жіберілді.",
    "savedAccount": "«{finish}» аккаунтыңа сақталды.",
    "accountSaveFailed": "Аккаунтқа сақтау сәтсіз болды. Қайта көр.",
    "invalid_identifier": "Дұрыс email не ел коды бар телефон нөмірін енгіз.",
    "short_password": "Кемінде 15 таңба енгіз.",
    "missing_code": "Тіркелу үшін SMS кодты енгіз.",
    "invalid_code": "Код қате немесе мерзімі өткен. Жаңа код сұрат.",
    "account_exists": "Мұндай аккаунт бар. Кіріп көр.",
    "incorrect_credentials": "Email, телефон нөмірі немесе пароль қате.",
    "sms_unavailable": "SMS растау қазір қолжетімсіз. Email арқылы тіркеле аласың.",
    "sms_failed": "SMS кодты жіберу не тексеру сәтсіз болды. Біраздан соң қайтала.",
    "too_many_attempts": "Әрекет тым көп болды. 10 минуттан кейін қайтала.",
    "accounts_unavailable": "Аккаунт үшін Aftro сервері керек. Прототипті іске қосылған қолданбадан аш.",
    "invalid_form": "Өрістерді тексеріп, қайтала."
  },
  "ru": {
    "account": "Аккаунт",
    "close": "Закрыть",
    "login": "Войти",
    "signup": "Зарегистрироваться",
    "email": "Email",
    "phone": "Номер телефона",
    "method": "Способ входа",
    "password": "Пароль",
    "show": "Показать",
    "hide": "Скрыть",
    "code": "Код из SMS",
    "send": "Отправить код",
    "signout": "Выйти",
    "phoneNote": "Введи номер с кодом страны, например +7.",
    "newPasswordNote": "Введи минимум 15 символов.",
    "profile": "Твой аккаунт",
    "profileNote": "Сохранённые варианты доступны при следующем входе.",
    "sent": "Код отправлен по SMS.",
    "savedAccount": "Вариант «{finish}» сохранён в аккаунте.",
    "accountSaveFailed": "Не удалось сохранить вариант в аккаунте. Попробуй ещё раз.",
    "invalid_identifier": "Введи корректный email или номер с кодом страны.",
    "short_password": "Введи минимум 15 символов.",
    "missing_code": "Введи код из SMS для регистрации.",
    "invalid_code": "Код неверен или истёк. Запроси новый.",
    "account_exists": "Аккаунт с этими данными уже существует. Попробуй войти.",
    "incorrect_credentials": "Неверный email, номер телефона или пароль.",
    "sms_unavailable": "Подтверждение по SMS пока недоступно. Можно зарегистрироваться по email.",
    "sms_failed": "Не удалось отправить или проверить код. Попробуй чуть позже.",
    "too_many_attempts": "Слишком много попыток. Попробуй через 10 минут.",
    "accounts_unavailable": "Для аккаунта нужен сервер Aftro. Открой интерфейс из запущенного приложения.",
    "invalid_form": "Проверь поля и попробуй снова."
  }
};
  for (const [locale, values] of Object.entries(copy)) Object.assign(messages[locale], values);

  const dialog = document.querySelector("#account-dialog");
  const accountButton = document.querySelector("#open-account");
  const form = document.querySelector("#auth-form");
  const identifier = document.querySelector("#auth-identifier");
  const password = document.querySelector("#auth-password");
  const code = document.querySelector("#auth-code");
  const method = document.querySelector("#auth-method");
  const notice = document.querySelector("#auth-notice");
  const tabs = [...document.querySelectorAll("[data-auth-mode]")];
  const submit = document.querySelector("#auth-submit");
  const sendCode = document.querySelector("#auth-send-code");
  const togglePassword = document.querySelector("#auth-toggle-password");
  const signOut = document.querySelector("#auth-signout");
  let user = null;
  let mode = "login";
  let message = null;
  let busy = false;

  const t = (key) => (copy[document.documentElement.lang] ?? copy.en)[key];
  const served = ["https:", "http:"].includes(location.protocol);
  const phoneSignup = () => mode === "signup" && method.value === "phone";

  async function request(path, verb = "GET", body) {
    if (!served) throw new Error("accounts_unavailable");
    let response;
    try {
      response = await fetch("/api/v1/auth" + path, {
        method: verb,
        headers: verb === "GET" ? { Accept: "application/json" } : { "Content-Type": "application/json" },
        body: verb === "GET" ? undefined : JSON.stringify(body ?? {}),
        cache: "no-store",
      });
    } catch {
      throw new Error("accounts_unavailable");
    }
    if (response.status === 204) return null;
    let data;
    try { data = await response.json(); } catch { throw new Error("accounts_unavailable"); }
    if (!response.ok) {
      const reason = response.status === 404 ? "accounts_unavailable" : data.detail;
      throw new Error(Object.hasOwn(copy.en, reason) ? reason : "invalid_form");
    }
    return data;
  }

  function render() {
    for (const el of document.querySelectorAll("[data-auth-text]")) el.textContent = t(el.dataset.authText);
    accountButton.setAttribute("aria-label", t(user ? "profile" : "login"));
    accountButton.title = t(user ? "profile" : "login");
    accountButton.dataset.signedIn = String(Boolean(user));
    notice.textContent = message ? t(message) : "";
    document.querySelector("#account-heading").textContent = t(user ? "profile" : mode);
    document.querySelector("#auth-close").setAttribute("aria-label", t("close"));
    document.querySelector("#auth-profile").hidden = !user;
    document.querySelector("#auth-profile-id").textContent = user?.identifier ?? "";
    document.querySelector("#auth-tabs").hidden = Boolean(user);
    form.hidden = Boolean(user);
    for (const button of tabs) {
      button.setAttribute("aria-pressed", String(button.dataset.authMode === mode));
      button.disabled = busy;
    }
    method.disabled = busy;
    identifier.disabled = busy;
    password.disabled = busy;
    code.disabled = busy || !phoneSignup();
    submit.disabled = busy;
    sendCode.disabled = busy;
    signOut.disabled = busy;
    document.querySelector("#auth-code-group").hidden = !phoneSignup();
    document.querySelector("#auth-phone-note").hidden = method.value !== "phone";
    document.querySelector("#auth-password-note").hidden = mode !== "signup";
    document.querySelector("#auth-identifier-label").textContent = t(method.value);
    identifier.type = method.value === "phone" ? "tel" : "email";
    identifier.placeholder = method.value === "phone" ? "+7 700 000 00 00" : "name@example.com";
    code.required = phoneSignup();
    password.minLength = mode === "signup" ? 15 : 1;
    password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    togglePassword.textContent = t(password.type === "password" ? "show" : "hide");
    submit.textContent = t(mode);
  }

  async function restoreSaved() {
    if (!user) return;
    try {
      const data = await request("/finishes/demo-apartment");
      if (data.finish_slug) selectFinish(data.finish_slug);
    } catch {
      // The current preview remains available when the saved finish cannot load.
    }
  }

  async function restoreSession() {
    try {
      user = await request("/me");
      await restoreSaved();
    } catch {
      // Guest access does not require an account.
    }
    render();
  }

  const ready = restoreSession();
  window.aftroAccount = {
    async saveFinish(finish) {
      await ready;
      if (!user) return "guest";
      try {
        await request("/finishes/demo-apartment", "PUT", { finish_slug: finish });
        return "savedAccount";
      } catch {
        return "accountSaveFailed";
      }
    },
  };

  async function perform(action) {
    if (busy) return;
    busy = true;
    message = null;
    render();
    try {
      await ready;
      await action();
    } catch (error) {
      message = Object.hasOwn(copy.en, error.message) ? error.message : "invalid_form";
    } finally {
      busy = false;
      render();
    }
  }

  accountButton.addEventListener("click", () => {
    message = !served ? "accounts_unavailable" : null;
    render();
    dialog.showModal();
  });
  document.querySelector("#auth-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    password.value = "";
    password.type = "password";
    render();
  });
  for (const button of tabs) {
    button.addEventListener("click", () => {
      mode = button.dataset.authMode;
      message = null;
      code.value = "";
      render();
    });
  }
  method.addEventListener("change", () => {
    identifier.value = "";
    code.value = "";
    message = null;
    render();
  });
  identifier.addEventListener("input", () => {
    code.value = "";
    if (message === "sent") { message = null; render(); }
  });
  togglePassword.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
    render();
  });
  sendCode.addEventListener("click", () => {
    if (!identifier.reportValidity()) return;
    const phone = identifier.value;
    perform(async () => {
      await request("/phone-code", "POST", { phone });
      message = "sent";
    });
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = { identifier: identifier.value, password: password.value };
    if (phoneSignup()) input.code = code.value;
    const endpoint = mode === "login" ? "/login" : "/register";
    perform(async () => {
      user = await request(endpoint, "POST", input);
      form.reset();
      password.type = "password";
      await restoreSaved();
    });
  });
  signOut.addEventListener("click", () => perform(async () => {
    await request("/logout", "POST");
    user = null;
    mode = "login";
    selectFinish(readPreference("aftro.demo.finish") ?? "warm");
  }));
  document.addEventListener("aftro:language", render);
  render();
})();
