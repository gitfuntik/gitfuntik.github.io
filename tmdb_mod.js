/* jshint esversion: 6 */
(function () {
    'use strict';

    // ---
    // 📼 --- БЛОК ПОЛИФИЛОВ (для поддержки старых ТВ) ---
    // ---

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            var k;
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            if (len === 0) {
                return -1;
            }
            k = fromIndex | 0;
            if (k < 0) {
                k += len;
                if (k < 0) k = 0;
            }
            for (; k < len; k++) {
                if (k in o && o[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    
    if (!Array.isArray) {
        Array.isArray = function(arg) {
            return Object.prototype.toString.call(arg) === '[object Array]';
        };
    }
        
    if (!Array.prototype.filter) {
        Array.prototype.filter = function(callback, thisArg) {
            var array = this;
            var result = [];
            for (var i = 0; i < array.length; i++) {
                if (callback.call(thisArg, array[i], i, array)) {
                    result.push(array[i]);
                }
            }
            return result;
        };
    }
    
    if (!Object.assign) {
        Object.assign = function(target) {
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
            return target;
        };
    }
    
    if (!Array.prototype.map) {
        Array.prototype.map = function(callback, thisArg) {
            var array = this;
            var result = [];
            for (var i = 0; i < array.length; i++) {
                result.push(callback.call(thisArg, array[i], i, array));
            }
            return result;
        };
    }
    
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(callback, thisArg) {
            var array = this;
            for (var i = 0; i < array.length; i++) {
                callback.call(thisArg, array[i], i, array);
            }
        };
    }
    
    if (!Array.prototype.includes) {
        Array.prototype.includes = function(searchElement) {
            return this.indexOf(searchElement) !== -1;
        };
    }
    
    if (!Date.prototype.toISOString) {
        Date.prototype.toISOString = function() {
            var pad = function(num) {
                return (num < 10 ? '0' : '') + num;
            };
            return (
                this.getUTCFullYear() +
                '-' +
                pad(this.getUTCMonth() + 1) +
                '-' +
                pad(this.getUTCDate()) +
                'T' +
                pad(this.getUTCHours()) +
                ':' +
                pad(this.getUTCMinutes()) +
                ':' +
                pad(this.getUTCSeconds()) +
                '.' +
                (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
                'Z'
            );
        };
    }
    
    if (!String.prototype.substr) {
        String.prototype.substr = function(start, length) {
            return this.slice(start, start + length);
        };
    }

    if (!Array.prototype.reduce) {
        Array.prototype.reduce = function(callback /*, initialValue*/) {
            if (this == null) {
                throw new TypeError('Array.prototype.reduce called on null or undefined');
            }
            if (typeof callback !== 'function') {
                throw new TypeError(callback + ' is not a function');
            }
            var o = Object(this);
            var len = o.length >>> 0;
            var k = 0;
            var value;
            if (arguments.length >= 2) {
                value = arguments[1];
            } else {
                while (k < len && !(k in o)) {
                    k++;
                }
                if (k >= len) {
                    throw new TypeError('Reduce of empty array with no initial value');
                }
                value = o[k++];
            }
            while (k < len) {
                if (k in o) {
                    value = callback(value, o[k], k, o);
                }
                k++;
            }
            return value;
        };
    }

    // ---
    // 🚩 --- КОНЕЦ БЛОКА ПОЛИФИЛОВ ---
    // ---


    /**
     * @name TMDB_MOD (Упрощенная версия)
     * @version 1.2.2 (Final Release)
     * @description Плагин для Lampa, который добавляет кастомные, 
     * настраиваемые подборки *только на главную страницу* (Discovery).
     * * == FAQ (Часто Задаваемые Вопросы) ==
     * * 1. ❓ **Что делает этот плагин?**
     * Плагин создает "источник" 'TMDB_MOD', который, будучи выбранным,
     * показывает на **главной странице** Lampa ваш собственный список подборок.
     * * 2. ❓ **Как добавить/изменить подборку?**
     * - Просто добавьте новый объект в массив `collectionsConfig`.
     * - **id**: Уникальный ID (напр. 'my_new_collection').
     * - **emoji**: '💥' (значок, необязательно).
     * - **name_key**: Ключ перевода (напр. 'tmdb_mod_c_my_new').
     * - **request**: Часть URL-запроса к API TMDB.
     * - *Не забудьте* добавить сам перевод в функцию `addTranslations()`.
     */

    // 🚩 Проверяем, не запущен ли плагин уже
    if (window.plugin_tmdb_mod_ready) return;
    window.plugin_tmdb_mod_ready = true;

    // 📅 Вычисляем динамические даты один раз при загрузке
    var today = new Date().toISOString().substr(0, 10); // 👈 Формат YYYY-MM-DD
    var currentYear = new Date().getFullYear(); // 👈 Текущий год
    var lastYear = currentYear - 1; // 👈 Прошлый год

    // 📌 Единая конфигурация всех подборок (id, emoji, ключ перевода, API-запрос)
    // 'type' не нужен, т.к. все выводится только на Главной
    var collectionsConfig = [
        //
        // 🎬 --- ФИЛЬМЫ ---
        //
        { id: 'hot_new_releases', emoji: '🎬', name_key: 'tmdb_mod_c_hot_new', request: 'discover/movie?sort_by=primary_release_date.desc&with_release_type=4|5|6&primary_release_date.lte=' + today + '&vote_count.gte=50&vote_average.gte=6&with_runtime.gte=40&without_genres=99&region=RU' }, // 🍿 Новинки, вышедшие в кино/цифре
        { id: 'trending_movies', emoji: '🔥', name_key: 'tmdb_mod_c_trend_movie', request: 'trending/movie/week' }, // 🔥 Самые популярные за 7 дней
        { id: 'fresh_online', emoji: '👀', name_key: 'tmdb_mod_c_watching_now', request: 'discover/movie?sort_by=popularity.desc&with_release_type=4|5|6&primary_release_date.lte=' + today + '&vote_count.gte=50&vote_average.gte=6&with_runtime.gte=40&without_genres=99&region=RU' }, // 📈 Популярные по количеству просмотров
        { id: 'cult_cinema', emoji: '🍿', name_key: 'tmdb_mod_c_cult', request: 'discover/movie?primary_release_date.gte=1980-01-01&sort_by=popularity.desc&vote_average.gte=7&vote_count.gte=500' }, // 📼 Классика и хиты прошлых лет
        { id: 'top_10_studios_mix', emoji: '🏆', name_key: 'tmdb_mod_c_top_studios', request: 'discover/movie?with_companies=6194|33|4|306|5|12|8411|9195|2|7295&sort_by=popularity.desc&vote_average.gte=7.0&vote_count.gte=1000' }, // 🏆 Микс Золотой Десятки
		
        // --- Динамические подборки по годам ---
        { id: 'best_of_current_year_movies', emoji: '🌟', name_key: 'tmdb_mod_c_best_current_y', request: 'discover/movie?primary_release_year=' + currentYear + '&sort_by=vote_average.desc&vote_count.gte=300&region=RU' }, // 🌟 Лучшее в ТЕКУЩЕМ году
		{ id: 'best_of_last_year_movies', emoji: '🏆', name_key: 'tmdb_mod_c_best_last_y', request: 'discover/movie?primary_release_year=' + lastYear + '&sort_by=vote_average.desc&vote_count.gte=500&region=RU' }, // 🏆 Лучшее в ПРОШЛОМ году
		
        // --- Жанры и страны ---
        { id: 'animation', emoji: '🧑‍🎤', name_key: 'tmdb_mod_c_animation', request: 'discover/movie?with_genres=16&sort_by=popularity.desc&vote_average.gte=7&vote_count.gte=500' }, // 🧸 Популярная анимация
        { id: 'documentary', emoji: '🔬', name_key: 'tmdb_mod_c_documentary', request: 'discover/movie?with_genres=99&sort_by=popularity.desc&vote_count.gte=20&with_translations=ru&include_translations=ru' }, // 🌍 Научпоп и документалистика
        { id: 'russian_movies', emoji: '🇷🇺', name_key: 'tmdb_mod_c_rus_new', request: 'discover/movie?with_original_language=ru&sort_by=primary_release_date.desc&with_release_type=4|5|6&primary_release_date.lte=' + today + '&with_runtime.gte=40&without_genres=99&region=RU' }, // 🇷🇺 Новые фильмы из России

        //
        // 📺 --- СЕРИАЛЫ ---
        //
        { id: 'trending_tv', emoji: '🔥', name_key: 'tmdb_mod_c_trend_tv', request: 'trending/tv/week' }, // 🔥 Самые популярные сериалы за 7 дней
        { id: 'best_world_series', emoji: '🌍', name_key: 'tmdb_mod_c_world_hits', request: 'discover/tv?with_origin_country=US|CA|GB|AU|IE|DE|FR|NL|SE|NO|DK|FI|ES|IT|BE|CH|AT|KR|JP|MX|BR&sort_by=last_air_date.desc&vote_average.gte=7&vote_count.gte=500&first_air_date.gte=2020-01-01&first_air_date.lte=' + today + '&without_genres=16|99|10762|10763|10764|10766|10767|10768|10770&with_status=0|1|2|3' }, // ⭐️ Популярные зарубежные сериалы (2020+)
        { id: 'netflix_best', emoji: '⚫', name_key: 'tmdb_mod_c_netflix', request: 'discover/tv?with_networks=213&sort_by=last_air_date.desc&first_air_date.gte=2020-01-01&last_air_date.lte=' + today + '&vote_count.gte=500&vote_average.gte=7&without_genres=16|99|10751|10762|10763|10764|10766|10767|10768|10770' }, // ⚫ Только от Netflix (2020+)
        
        // --- Уникальные подборки ---
        { id: 'miniseries_hits', emoji: '💎', name_key: 'tmdb_mod_c_miniseries', request: 'discover/tv?with_type=2&sort_by=popularity.desc&vote_average.gte=7.0&vote_count.gte=200&without_genres=10764,10767' }, // 💎 Сериалы с 1 сезоном (тип Miniseries)
		{ id: 'russian_series', emoji: '🇷🇺', name_key: 'tmdb_mod_c_rus_series', request: 'discover/tv?with_original_language=ru&sort_by=last_air_date.desc&first_air_date.gte=2020-01-01&last_air_date.lte=' + today + '&vote_average.gte=6&vote_count.gte=5&without_genres=16|99|10751|10762|10763|10764|10766|10767|10768' }, // 🇷🇺 Популярные сериалы из России (2020+)
        
        // --- 📺 Originals (сериалы от конкретных платформ) ---
        { id: 'okko_platform', emoji: '📺', name_key: 'tmdb_mod_c_okko', request: 'discover/tv?language=ru&with_networks=3871&sort_by=first_air_date.desc' }, 
        { id: 'premier_platform', emoji: '📺', name_key: 'tmdb_mod_c_premier', request: 'discover/tv?language=ru&with_networks=2859&sort_by=first_air_date.desc' }, 
        { id: 'start_platform', emoji: '📺', name_key: 'tmdb_mod_c_start', request: 'discover/tv?language=ru&with_networks=2493&sort_by=first_air_date.desc' }, 
        { id: 'wink_platform', emoji: '📺', name_key: 'tmdb_mod_c_wink', request: 'discover/tv?language=ru&with_networks=5806&sort_by=first_air_date.desc' }, 
        { id: 'kion_platform', emoji: '📺', name_key: 'tmdb_mod_c_kion', request: 'discover/tv?language=ru&with_networks=4085&sort_by=first_air_date.desc' }, 
        { id: 'kinopoisk_platform', emoji: '📺', name_key: 'tmdb_mod_c_kinopoisk', request: 'discover/tv?language=ru&with_networks=3827&sort_by=first_air_date.desc' }, 
        { id: 'cts_platform', emoji: '📺', name_key: 'tmdb_mod_c_cts', request: 'discover/tv?language=ru&with_networks=806&sort_by=first_air_date.desc' }, 
        { id: 'tnt_platform', emoji: '📺', name_key: 'tmdb_mod_c_tnt', request: 'discover/tv?language=ru&with_networks=1191&sort_by=first_air_date.desc' }, 
        { id: 'ivi_platform', emoji: '📺', name_key: 'tmdb_mod_c_ivi', request: 'discover/tv?language=ru&with_networks=3923&sort_by=first_air_date.desc' } 
    ];

    // ⚙️ Настройки плагина по умолчанию (включен, все подборки активны)
    var pluginSettings = {
        enabled: true,
        collections: collectionsConfig.reduce(function(acc, c) { acc[c.id] = true; return acc; }, {})
    };

    /**
     * 📥 Загружает сохранённые настройки плагина из Lampa.Storage.
     * @returns {object} - Объект с загруженными настройками.
     */
    function loadSettings() {
        // Обертка для Lampa.Storage на случай, если он еще не инициализирован
        if (Lampa.Storage) {
            pluginSettings.enabled = Lampa.Storage.get('tmdb_mod_enabled', true);
            collectionsConfig.forEach(function(cfg) {
                pluginSettings.collections[cfg.id] = Lampa.Storage.get('tmdb_mod_collection_' + cfg.id, true);
            });
        }
        return pluginSettings;
    }

    /**
     * 💾 Сохраняет текущие настройки плагина в Lampa.Storage.
     */
    function saveSettings() {
        if (Lampa.Storage) {
            Lampa.Storage.set('tmdb_mod_enabled', pluginSettings.enabled);
            collectionsConfig.forEach(function(cfg) {
                Lampa.Storage.set('tmdb_mod_collection_' + cfg.id, pluginSettings.collections[cfg.id]);
            });
        }
    }

    /**
     * 🌍 Добавляет переводы для плагина
     */
    function addTranslations() {
        if (!Lampa.Lang) return; // Проверяем, что Lampa.Lang доступен

        Lampa.Lang.add({
            // --- Общие ---
            tmdb_mod_plugin_name: {
                ru: "Подборки TMDB_MOD" // 👈 Изменено
            },
            tmdb_mod_toggle_name: {
                ru: "Включить TMDB_MOD подборки"
            },
            tmdb_mod_toggle_desc: {
                ru: "Показывать кастомные подборки на главной странице"
            },
            tmdb_mod_noty_reload: {
                ru: "Изменения вступят в силу после перезагрузки главной страницы"
            },
            tmdb_mod_show_collection: {
                ru: "Показывать подборку"
            },

            // --- Фильмы ---
            tmdb_mod_c_hot_new: { ru: "Самые свежие премьеры" },
            tmdb_mod_c_trend_movie: { ru: "Топ фильмов недели" },
            tmdb_mod_c_watching_now: { ru: "Сейчас смотрят" },
            tmdb_mod_c_cult: { ru: "Популярные фильмы с 80-х" },
            tmdb_mod_c_top_studios: { ru: "Золотая Десятка Студий" },
            tmdb_mod_c_best_current_y: { ru: "Лучшее фильмы в " + currentYear + " году" },
            tmdb_mod_c_best_last_y: { ru: "Лучшие фильмы " + lastYear + " года" },
            tmdb_mod_c_animation: { ru: "Лучшие мультфильмы" },
            tmdb_mod_c_documentary: { ru: "Документальные фильмы" },
            tmdb_mod_c_rus_new: { ru: "Новинки русского кино" },

            // --- Сериалы ---
            tmdb_mod_c_trend_tv: { ru: "Топ сериалов недели" },
            tmdb_mod_c_world_hits: { ru: "Хиты сериалов мира 2020+" },
            tmdb_mod_c_netflix: { ru: "Хиты сериалов Netflix" },
            tmdb_mod_c_miniseries: { ru: "Лучшие Мини-сериалы" },
            tmdb_mod_c_rus_series: { ru: "Лучшие русскоязычные сериалы 2020+" },

            // --- Платформы ---
            tmdb_mod_c_okko: { ru: "ОККО Originals" },
            tmdb_mod_c_premier: { ru: "Premier Originals" },
            tmdb_mod_c_start: { ru: "START Originals" },
            tmdb_mod_c_wink: { ru: "WINK Originals" },
            tmdb_mod_c_kion: { ru: "KION Originals" },
            tmdb_mod_c_kinopoisk: { ru: "Кинопоиск Originals" },
            tmdb_mod_c_cts: { ru: "СТС Originals" },
            tmdb_mod_c_tnt: { ru: "ТНТ Originals" },
            tmdb_mod_c_ivi: { ru: "ИВИ Originals" }
        });
    }
    
    // ---
    // 🍿 Функции для создания кастомных подборок
    // ---

    /**
     * 🏠 Создает фабрику функций для загрузки подборок на Главную страницу (Discovery).
     * @param {object} parent - Родительский API (в данном случае клон tmdb_mod).
     * @returns {function} - Функция, которую Lampa вызывает для загрузки данных (oncomplete, onerror).
     */
    var createDiscoveryMain = function (parent) {
        return function () {
            var owner = this;
            var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
            var oncomplete = arguments.length > 1 ? arguments[1] : undefined;
            var onerror = arguments.length > 2 ? arguments[2] : undefined;

            // 🔄 Проверяем, доступны ли в Lampa методы для последовательной загрузки
            var hasSequentials = Lampa.Api && Lampa.Api.sequentials && typeof Lampa.Api.sequentials === 'function';
            var hasPartNext = Lampa.Api && Lampa.Api.partNext && typeof Lampa.Api.partNext === 'function';

            if (!hasSequentials && !hasPartNext) { if (onerror) onerror(); return; }

            var settings = loadSettings();
            var parts_data = [];
            var totalCount = 0;

            // 🧩 Собираем массив функций для загрузки каждой подборки
            collectionsConfig.forEach(function(cfg) {
                // Добавляем только те, что включены в настройках
                if (settings.collections[cfg.id]) {
                    totalCount++;
                    parts_data.push(function (call) { 
                        parent.get(cfg.request, params, function (json) { 
                            // 💡 Используем ключ для перевода и добавляем эмодзи
                            var translatedName = Lampa.Lang.translate(cfg.name_key);
                            json.title = cfg.emoji ? cfg.emoji + ' ' + translatedName : translatedName; 
                            
                            // 📦 Добавляем источник 'tmdb' (требование Lampa 3.0+)
                            if (Lampa.Utils && Lampa.Utils.addSource) {
                                Lampa.Utils.addSource(json, 'tmdb');
                            }
                            
                            call(json); 
                        }, function(err) {
                            console.error('Ошибка загрузки подборки "' + cfg.id + '":', err);
                            // ⚠️ В случае ошибки возвращаем пустой результат, но с заголовком
                            var translatedName = Lampa.Lang.translate(cfg.name_key);
                            var title = cfg.emoji ? cfg.emoji + ' ' + translatedName : translatedName;
                            call({ source: 'tmdb', results: [], title: title });
                        }); 
                    });
                }
            });
            
            if (parts_data.length === 0) {
                if (onerror) onerror();
                return function () {}; // 🤷‍♂️ Если ничего не выбрано, возвращаем пустоту
            }

            // 🚀 Выбираем доступный метод API для загрузки (sequentials или partNext)
            var methodToUse = Lampa.Api.sequentials ? Lampa.Api.sequentials : Lampa.Api.partNext;
            methodToUse(parts_data, totalCount, oncomplete, onerror); 
            return function () {};
        };
    };
    
    /**
     * 🛠️ Добавляет страницу настроек плагина в Lampa.
     */
    function addSettings() {
        // 📥 Загружаем актуальные настройки перед отрисовкой
        loadSettings(); 

        // ✋ Проверяем, что API настроек доступно
        if (!Lampa.SettingsApi) return;
        
        // 🖼️ Добавляем свой раздел (компонент) в Настройки
        Lampa.SettingsApi.addComponent({
            component: 'tmdb_mod',
            name: Lampa.Lang.translate('tmdb_mod_plugin_name'), // 💡 Используем перевод
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-tv"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>'
        });

        // 🔥 Главный переключатель (вкл/выкл) для всего плагина
        Lampa.SettingsApi.addParam({
            component: 'tmdb_mod',
            param: { name: 'tmdb_mod_enabled', type: 'trigger', default: true },
            // 💡 Используем перевод
            field: { name: Lampa.Lang.translate('tmdb_mod_toggle_name'), description: Lampa.Lang.translate('tmdb_mod_toggle_desc') },
            onChange: function (value) {
                pluginSettings.enabled = value;
                saveSettings();
                Lampa.Noty.show(Lampa.Lang.translate('tmdb_mod_noty_reload')); // 💡 Используем перевод
            }
        });

        // 🎛️ Динамически генерируем переключатели для каждой подборки
        collectionsConfig.forEach(function(cfg) {
            // 💡 Получаем переведенное имя
            var translatedName = Lampa.Lang.translate(cfg.name_key);
            // 💡 Собираем полное имя с эмодзи
            var fullDisplayName = cfg.emoji ? cfg.emoji + ' ' + translatedName : translatedName;
            
            Lampa.SettingsApi.addParam({
                component: 'tmdb_mod',
                param: { name: 'tmdb_mod_collection_' + cfg.id, type: 'trigger', default: true },
                // 💡 Используем переведенные и собранные строки
                field: { 
                    name: fullDisplayName, 
                    description: Lampa.Lang.translate('tmdb_mod_show_collection') + ' "' + translatedName + '"' 
                },
                onChange: function (value) {
                    pluginSettings.collections[cfg.id] = value;
                    saveSettings();
                    Lampa.Noty.show(Lampa.Lang.translate('tmdb_mod_noty_reload')); // 💡 Используем перевод
                }
            });
        });

        // 🔄 Синхронизируем состояние чекбоксов в UI при открытии настроек
        if (Lampa.Settings && Lampa.Settings.listener) {
            Lampa.Settings.listener.follow('open', function (e) {

                // 💡 Синхронизируем ТОЛЬКО если открыта НАША страница
                if (e.name === 'tmdb_mod') {
                
                    // ⏳ Даем UI немного времени на отрисовку
                    setTimeout(function () {
                        // 🔌 Синхронизируем главный переключатель
                        document.querySelectorAll('[data-name="tmdb_mod_enabled"]').forEach(function(el) { if (el.type === 'checkbox') el.checked = pluginSettings.enabled; });
                        // 🔌 Синхронизируем все переключатели подборок
                        collectionsConfig.forEach(function(cfg) {
                            document.querySelectorAll('[data-name="tmdb_mod_collection_' + cfg.id + '"]').forEach(function(el) {
                                if (el.type === 'checkbox') el.checked = pluginSettings.collections[cfg.id];
                            });
                        });
                    }, 100);
                }
            });
        }
    }

    // ---
    
    /**
     * 🚀 Основная функция инициализации плагина.
     */
    function initPlugin() {
        try {
            // ✋ Убеждаемся, что API Lampa и стандартный источник 'tmdb' загружены
            if (!Lampa.Api || !Lampa.Api.sources || !Lampa.Api.sources.tmdb) return false;

            // 🐑 Клонируем оригинальный API 'tmdb'
            var originalTMDB = Lampa.Api.sources.tmdb;
            var settings = loadSettings();
            
            // 1. 🆕 Создаем наш собственный источник 'tmdb_mod' на основе оригинала
            var tmdb_mod = Object.assign({}, originalTMDB);
            Lampa.Api.sources.tmdb_mod = tmdb_mod;
            Object.defineProperty(Lampa.Api.sources, 'tmdb_mod', { get: function get() { return tmdb_mod; } });

            // 2. 🔄 Подменяем метод 'main' в нашем источнике
            var originalMain = originalTMDB.main; 

            tmdb_mod.main = function () {
                var args = Array.from(arguments);
                
                // 🟢 Если плагин включен И это главная страница (не "Фильмы" и не "Сериалы")
                // Мы также должны перезагружать настройки, если они изменились
                if (loadSettings().enabled && this.type !== 'movie' && this.type !== 'tv') {
                    // Используем нашу кастомную функцию
                    return createDiscoveryMain(tmdb_mod).apply(this, args);
                }
                
                // 🔴 Во всех остальных случаях
                // Возвращаем стандартное поведение
                return originalMain.apply(this, args);
            };

            // 3. 🌐 Добавляем 'TMDB_MOD' в выпадающий список выбора источников
            if (Lampa.Params && Lampa.Params.select) {
                try {
                    var sources = Lampa.Params.values && Lampa.Params.values.source ? Lampa.Params.values.source : {};
                    if (!sources.tmdb_mod) {
                        sources.tmdb_mod = 'TMDB_MOD'; 
                        Lampa.Params.select('source', sources, 'tmdb'); 
                    }
                } catch (e) {}
            }

            return true;
        } catch (e) { return false; }
    }

    /**
     * ⏳ Ожидает полной загрузки Lampa.
     */
    function waitForApp() {
        // Обертка для Lampa.Listener
        function onAppReady() {
            addTranslations(); // 💡 Сначала добавляем переводы
            initPlugin();
            addSettings(); 
        }

        if (window.appready) {
            onAppReady();
        } else if (Lampa.Listener && typeof Lampa.Listener.follow === 'function') {
            Lampa.Listener.follow('app', function (e) {
                if (e.type === 'ready') {
                    onAppReady();
                }
            });
        } else {
            setTimeout(waitForApp, 1000);
        }
    }

    // ▶️ Запускаем процесс ожидания Lampa
    waitForApp();

})();