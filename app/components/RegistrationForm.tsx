"use client";

import Script from "next/script";
import { FormEvent, useCallback, useEffect, useState } from "react";

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  themeParams: Record<string, string | undefined>;
};

function getWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") return null;
  console.log("getwebapp", window);
  return (
    (window as Window & { Telegram?: { WebApp: TelegramWebApp } }).Telegram
      ?.WebApp ?? null
  );
}

export default function RegistrationForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const initTelegram = useCallback(() => {
    const tg = getWebApp();
    if (!tg) return;
    tg.ready();
    tg.expand();
    setReady(true);
  }, []);

  useEffect(() => {
    if (getWebApp()) initTelegram();
  }, [initTelegram]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const tg = getWebApp();
    console.log("tg", tg);
    if (!tg) {
      setError("Откройте форму через Telegram (кнопка «Регистрация» в боте).");
      return;
    }

    const form = e.currentTarget;
    const full_name = (
      form.elements.namedItem("full_name") as HTMLInputElement
    ).value.trim();
    const iin = (
      form.elements.namedItem("iin") as HTMLInputElement
    ).value.replace(/\D/g, "");
    const phoneEl = form.elements.namedItem("phone") as HTMLInputElement;
    const phone = phoneEl.value.trim() || null;

    if (!full_name) {
      setError("Укажите ФИО");
      return;
    }
    if (iin.length !== 12) {
      setError("ИИН должен содержать 12 цифр");
      return;
    }

    setSubmitting(true);
    try {
      const payload = JSON.stringify({
        full_name,
        iin,
        phone,
      });

      console.log("Отправляем данные:", payload);

      tg.sendData(payload);

      console.log("sendData вызван");
    } catch (err) {
      console.error("Ошибка sendData:", err);
      setError("Не удалось отправить данные");
      setSubmitting(false);
    }
    tg.sendData(JSON.stringify({ full_name, iin, phone }));
    tg.close();
  }

  return (
    <>
      <Script
        src="https://telegram.org/js/telegram-web-app.js"
        strategy="afterInteractive"
        onLoad={initTelegram}
      />
      <div className="min-h-screen bg-[var(--tg-bg,#f4f4f5)] text-[var(--tg-text,#111)] px-4 py-6 max-w-md mx-auto">
        <h1 className="text-xl font-semibold mb-2">Регистрация</h1>
        <p className="text-sm opacity-75 mb-6">
          Заполните данные. ИИН должен быть в списке, созданном администратором.
        </p>

        {!ready && (
          <p className="text-sm mb-4 opacity-60">Загрузка Telegram Web App…</p>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="opacity-85">ФИО</span>
            <input
              name="full_name"
              required
              maxLength={200}
              autoComplete="name"
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-base"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="opacity-85">ИИН (12 цифр)</span>
            <input
              name="iin"
              required
              inputMode="numeric"
              pattern="[0-9]{12}"
              maxLength={12}
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-base"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="opacity-85">Телефон (необязательно)</span>
            <input
              name="phone"
              type="tel"
              maxLength={32}
              autoComplete="tel"
              className="rounded-xl border border-black/10 bg-white px-3 py-3 text-base"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-xl bg-[#2481cc] text-white font-semibold py-3.5 disabled:opacity-50"
          >
            Отправить
          </button>
        </form>
      </div>
    </>
  );
}
