(function () {
  const data = window.PORTFOLIO_DATA;
  if (!data) return;

  // Set your Formspree endpoint in assets/js/content.js after creating your form.
  const app = { ...data.app };
  const heroBanners = data.heroBanners || {};
  const text = data.text;
  const collections = data.collections;
  const campaignData = data.campaignData;
  const motionVideos = data.motionVideos;

  function buildItemIndex() {
    const index = {};
    Object.values(collections).forEach((group) => {
      group.forEach((item) => {
        if (item.campaignId) index[item.campaignId] = item;
      });
    });
    return index;
  }

  const itemIndex = buildItemIndex();

  function t(key) {
    return text[app.language][key] || key;
  }

  function applyLanguage() {
    document.documentElement.lang = app.language === "jp" ? "ja" : "en";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.classList.toggle("active", button.dataset.lang === app.language);
    });
    updateNavState();
    renderAllGrids();
    if (app.currentView === "campaign" && app.openCampaignId) {
      openCampaign(app.openCampaignId, false);
    }
    const heroBannerImage = document.getElementById("heroBannerImage");
    if (heroBannerImage && heroBanners[app.language]) {
      heroBannerImage.src = heroBanners[app.language];
      heroBannerImage.alt = t("heroHeadline");
    }
  }

  function createTile(item) {
  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "hover-tile project-tile";
  tile.innerHTML = `
    <img src="${item.image}" alt="${item.title[app.language]}">
    <span class="tile-overlay">${item.title[app.language]}</span>
  `;
  tile.addEventListener("click", () => {
    if (item.openView) {
      showView(item.openView);
      return;
    }
    if (item.campaignId) {
      openCampaign(item.campaignId);
    }
  });
  return tile;
}

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function getVideoThumbnail(media) {
  if (media.thumbnail) return media.thumbnail;
  const id = getYouTubeId(media.src || "");
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return "assets/images/thumbnails/video-default.jpg";
}

  function renderCollection(id, list) {
    const root = document.getElementById(id);
    root.innerHTML = "";
    list.forEach((item) => root.appendChild(createTile(item)));
  }

  function renderAllGrids() {
    renderCollection("webGrid", collections.web);
    renderCollection("designGrid", collections.design);
    renderCollection("motionGrid", collections.motion);
    renderCollection("brandGrid", collections.brand);
    renderMotionVideos();
  }

  function getHashRoute() {
    return window.location.hash.replace(/^#/, "").trim();
  }

  function handleHashChange() {
    const route = getHashRoute();
    if (route === "campaign") {
      if (app.openCampaignId) {
        openCampaign(app.openCampaignId, true, false);
      } else {
        showView("work", false);
      }
      return;
    }

    if (route === "about" || route === "contact" || route === "motion") {
      showView(route, false);
      return;
    }

    if (route.startsWith("campaign:")) {
      const campaignId = decodeURIComponent(route.slice("campaign:".length));
      if (campaignId) {
        openCampaign(campaignId, true, false);
        return;
      }
    }

    showView("work", false);
  }

  function showView(viewName, pushHash = true) {
    app.currentView = viewName;
    const map = {
      work: "workView",
      about: "aboutView",
      contact: "contactView",
      campaign: "campaignView",
      motion: "motionView"
    };

    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    document.getElementById(map[viewName]).classList.add("active");
    updateNavState();
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Only push simple hashes for non-campaign views
    if (pushHash && viewName !== "campaign") {
      const nextHash = `#${viewName}`;
      if (window.location.hash !== nextHash) window.location.hash = viewName;
    }
  }

  function updateNavState() {
    document.querySelectorAll(".nav-btn").forEach((button) => {
      button.style.color = button.dataset.nav === app.currentView ? "#32cd32" : "#202020";
    });
    document.querySelectorAll(".mobile-nav-btn").forEach((button) => {
      button.style.color = button.dataset.nav === app.currentView ? "#32cd32" : "#f5f5f5";
    });
  }

  function closeMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    if (!menu) return;
    menu.classList.remove("open");
    menu.setAttribute("aria-hidden", "true");
  }

  function openMobileMenu() {
    const menu = document.getElementById("mobileMenu");
    if (!menu) return;
    menu.classList.add("open");
    menu.setAttribute("aria-hidden", "false");
  }

  function openCampaign(id, updateView = true, pushHash = true) {
    const campaign = campaignData[id] || createAutoCampaign(id);
    if (!campaign) return;
    app.openCampaignId = id;
    document.getElementById("campaignBanner").src = campaign.banner;
    document.getElementById("campaignTitle").textContent = campaign.title[app.language];
    document.getElementById("campaignProblemText").textContent = campaign.problem[app.language];
    const roleNode = document.getElementById("campaignRoleText");
    const roleValue = campaign.role[app.language];
    if (Array.isArray(roleValue)) {
      roleNode.innerHTML = roleValue.map((item) => `<li>${item}</li>`).join("");
    } else {
      roleNode.innerHTML = `<li>${roleValue}</li>`;
    }
    document.getElementById("campaignApproachText").textContent = campaign.approach[app.language];
    document.getElementById("campaignImpactText").textContent = campaign.impact[app.language];
    const extraNode = document.getElementById("campaignExtraText");
    const impactHeading = document.querySelector('#campaignView [data-i18n="campaignImpact"]');
    if (impactHeading) {
      impactHeading.textContent = campaign.impactTitle
        ? localizedText(campaign.impactTitle)
        : t("campaignImpact");
    }
    document.getElementById("campaignImpactText").textContent = localizedText(campaign.impact);
    if (campaign.extra && campaign.extra[app.language]) {
      extraNode.textContent = campaign.extra[app.language];
      extraNode.style.display = "block";
    } else {
      extraNode.textContent = "";
      extraNode.style.display = "none";
    }

    const topWrap = document.getElementById("campaignTopLinkWrap");
    const bottomWrap = document.getElementById("campaignBottomLinkWrap");
    topWrap.innerHTML = "";
    bottomWrap.innerHTML = "";

    if (campaign.externalLink && campaign.externalLink.url) {
      const label = localizedText(campaign.externalLink);
      const url = campaign.externalLink.url;

      const topBtn = document.createElement("a");
      topBtn.href = url;
      topBtn.target = "_blank";
      topBtn.rel = "noreferrer";
      topBtn.className = "inline-flex items-center justify-center px-6 h-12 rounded-xl bg-[#32cd32] text-white font-semibold";
      topBtn.textContent = label;
      topWrap.appendChild(topBtn);

      const bottomBtn = document.createElement("a");
      bottomBtn.href = url;
      bottomBtn.target = "_blank";
      bottomBtn.rel = "noreferrer";
      bottomBtn.className = "inline-flex items-center justify-center px-6 h-12 rounded-xl border border-[#32cd32] text-[#32cd32] font-semibold";
      bottomBtn.textContent = label;
      bottomWrap.appendChild(bottomBtn);
    }

    if (updateView) showView("campaign", false);

    if (pushHash) {
      const nextHash = `#campaign:${encodeURIComponent(id)}`;
      if (window.location.hash !== nextHash) {
        window.location.hash = `campaign:${encodeURIComponent(id)}`;
      }
    }

    function localizedText(value) {
      if (typeof value === "string") return value;
      if (value && typeof value === "object") return value[app.language] || value.en || "";
      return "";
    }

    const grid = document.getElementById("campaignMediaGrid");
    grid.innerHTML = "";
    campaign.media.forEach((media, index) => {
      if (media.type === "heading") {
        const heading = document.createElement("h4");
        heading.className = "fs-36 font-semibold mt-4 mb-[25px] md:mb-[25px] md:col-span-2";
        heading.textContent = localizedText(media.text);
        grid.appendChild(heading);
        return;
      }

      if (media.type === "paragraph") {
        const p = document.createElement("p");
        const prev = campaign.media[index - 1];
        const hasHeadingBefore = prev && prev.type === "heading";

        p.className = hasHeadingBefore
          ? "fs-20 text-[#353636] leading-[1.55] mt-0 mb-[28px] md:mb-[36px] md:col-span-2"
          : "fs-20 text-[#353636] leading-[1.55] mt-0 mb-[16px] md:mb-[24px] md:col-span-2";

        if (media.textHtml) {
        p.innerHTML = media.textHtml[app.language] || "";
      } else {
        p.textContent = localizedText(media.text);
      }

      if (media.italic) {
        const em = document.createElement("em");
        em.textContent = localizedText(media.italic);
        em.className = "block mt-2 fs-14 text-[#494949]";
        p.appendChild(document.createElement("br"));
        p.appendChild(em);
      }

        grid.appendChild(p);
        return;
      }

      if (media.type === "spacer") {
        const spacer = document.createElement("div");
        spacer.className = media.size === "group" ? "h-[20px] md:h-[32px] md:col-span-2" : "h-[10px] md:h-[16px] md:col-span-2";
        grid.appendChild(spacer);
        return;
      }

      if (media.type === "image") {
        const image = document.createElement("img");
        image.src = media.src;
        image.alt = campaign.title[app.language];
        image.className = "w-full h-auto object-cover";
        if (media.fullWidth) image.classList.add("md:col-span-2");
        grid.appendChild(image);
        return;
      }

      if (media.type === "video") {
        const videoTile = document.createElement("button");
        videoTile.type = "button";
        videoTile.className = "video-tile";
        videoTile.style.aspectRatio = media.ratio || "16 / 9";

        if (media.fullWidth) {
          videoTile.classList.add("md:col-span-2");
        }

        const thumb = getVideoThumbnail(media);
        videoTile.innerHTML = `
          <img src="${thumb}" alt="Video thumbnail" class="video-thumb">
          <span class="video-play" aria-hidden="true">
            <span class="video-play-icon-wrap">
              <svg viewBox="0 0 24 24" class="video-play-icon" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="8,6 19,12 8,18"></polygon>
              </svg>
            </span>
          </span>
        `;
        videoTile.addEventListener("click", () => openVideo(media.src, media.local));
        grid.appendChild(videoTile);
      }
    });

  }

  function createAutoCampaign(id) {
    const item = itemIndex[id];
    if (!item) return null;
    const autoCampaign = {
      title: item.title,
      banner: item.image,
      problem: {
        en: "A clear visual direction was needed to increase campaign attention.",
        jp: "キャンペーンの注目度を高めるため、明確なビジュアル設計が必要でした。"
      },
      role: {
        en: "Art direction, composition planning, and collaboration with marketing team.",
        jp: "アートディレクション、構図設計、マーケティングチーム連携を担当。"
      },
      approach: {
        en: "Kept messages simple and visual hierarchy strong for digital placements.",
        jp: "デジタル掲載向けに、メッセージを絞り情報階層を明確化しました。"
      },
      impact: {
        en: "Delivered consistent brand look and improved communication clarity.",
        jp: "ブランドの統一感を維持し、伝達の明確性を向上しました。"
      },
      extra: {
        en: "Designed with scalable templates so this campaign can easily expand to more placements later.",
        jp: "今後の媒体追加にも対応できるよう、拡張しやすいテンプレート設計で制作しました。"
      },
      media: [
        { type: "image", src: item.image },
        { type: "image", src: item.image },
        { type: "image", src: item.image },
        { type: "image", src: item.image }
      ]
    };
    campaignData[id] = autoCampaign;
    return autoCampaign;
  }

  function renderMotionVideos() {
  const grid = document.getElementById("motionVideoGrid");
  grid.innerHTML = "";

  motionVideos.forEach((item) => {
    const media = typeof item === "string" ? { type: "video", src: item } : item;

    if (media.type === "heading") {
      const heading = document.createElement("h4");
      heading.className = "fs-36 font-semibold mt-0 md:col-span-2"
      heading.textContent = (media.text && media.text[app.language]) || "";
      grid.appendChild(heading);
      return;
    }

    if (media.type === "paragraph") {
      const p = document.createElement("p");
      p.className = "fs-20 text-[#353636] leading-[1.55] mt-0 mb-[25px] md:col-span-2";
      
      if (media.textHtml) {
        p.innerHTML = media.textHtml[app.language] || "";
      } else {
        p.textContent = localizedText(media.text);

      }

      grid.appendChild(p);
      return;
    }

    if (item.openView) {
      showView(item.openView);
      return;
    }
    if (item.campaignId) {
      openCampaign(item.campaignId);
    }

    if (media.type === "video") {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "video-tile";
      tile.style.aspectRatio = media.ratio || "16 / 9";

      if (media.type === "paragraph") {
        const p = document.createElement("p");
        const prev = campaign.media[index - 1];
        const hasHeadingBefore = prev && prev.type === "heading";
        const isNote = media.variant === "note";

        if (isNote) {
          // compact explanation text between media groups
          p.className = "fs-20 text-[#353636] leading-[1.55] mt-0 mb-[16px] md:mb-[20px] md:col-span-2";
        } else if (hasHeadingBefore) {
          // normal heading + paragraph + media group
          p.className = "fs-20 text-[#353636] leading-[1.55] mt-0 mb-[28px] md:mb-[36px] md:col-span-2";
        } else {
          // paragraph without heading
          p.className = "fs-20 text-[#353636] leading-[1.55] mt-0 mb-[20px] md:mb-[28px] md:col-span-2";
        }

        if (media.textHtml) {
          p.innerHTML = media.textHtml[app.language] || "";
        } else {
          p.textContent = localizedText(media.text);
          
        }

        grid.appendChild(p);
        return;
      }

      const thumb = getVideoThumbnail(media);
      tile.innerHTML = `
        <img src="${thumb}" alt="Video thumbnail" class="video-thumb">
        <span class="video-play" aria-hidden="true">
          <span class="video-play-icon-wrap">
            <svg viewBox="0 0 24 24" class="video-play-icon" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="8,6 19,12 8,18"></polygon>
            </svg>
          </span>
        </span>
      `;
      tile.addEventListener("click", () => openVideo(media.src, media.local));
      grid.appendChild(tile);
    }
  });
}

  function openVideo(source, isLocal = false) {
    const wrap = document.getElementById("videoFrameWrap");
    const isMp4 = /\.mp4($|\?)/i.test(source);
    if (isLocal || isMp4) {
      wrap.innerHTML = `<video src="${source}" controls autoplay playsinline></video>`;
    } else {
      wrap.innerHTML = `<iframe src="${source}?autoplay=1" title="Campaign video" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }
    document.getElementById("videoModal").classList.add("open");
  }

  function closeVideoModal() {
    document.getElementById("videoModal").classList.remove("open");
    document.getElementById("videoFrameWrap").innerHTML = "";
  }

  function initEvents() {
    document.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => showView(button.dataset.nav));
    });

    document.querySelectorAll("[data-lang]").forEach((button) => {
      button.addEventListener("click", () => {
        app.language = button.dataset.lang;
        applyLanguage();
      });
    });

    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-campaign-link]");
      if (!link) return;
      event.preventDefault();
      const campaignId = link.getAttribute("data-campaign-link");
      if (campaignId) openCampaign(campaignId);
    });

    document.querySelectorAll("[data-back='work']").forEach((button) => {
      button.addEventListener("click", () => showView("work"));
    });

    const mobileMenuToggle = document.getElementById("mobileMenuToggle");
    const mobileMenuClose = document.getElementById("mobileMenuClose");
    const mobileMenu = document.getElementById("mobileMenu");
    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", openMobileMenu);
    }
    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", closeMobileMenu);
    }
    if (mobileMenu) {
      mobileMenu.addEventListener("click", (event) => {
        if (event.target.id === "mobileMenu") closeMobileMenu();
      });
    }
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileMenu();
    });

    document.getElementById("backTopBtn").addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("closeModalBtn").addEventListener("click", closeVideoModal);
    document.getElementById("videoModal").addEventListener("click", (event) => {
      if (event.target.id === "videoModal") closeVideoModal();
    });

    document.getElementById("contactForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const submitButton = event.target.querySelector('button[type="submit"]');
      const formData = new FormData(event.target);
      const fullName = `${formData.get("firstName")} ${formData.get("lastName")}`.trim();
      const subject = formData.get("subject");
      const message = formData.get("message");
      const email = formData.get("email");

      if (app.useFormspree) {
        if (app.formspreeEndpoint.includes("your-form-id")) {
          alert(app.language === "jp" ? "Formspree のエンドポイントを設定してください。" : "Please set your Formspree endpoint first.");
          return;
        }

        const payload = {
          name: fullName,
          email,
          subject,
          message
        };
        try {
          submitButton.disabled = true;
          submitButton.style.opacity = "0.7";
          const response = await fetch(app.formspreeEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
          });
          if (response.ok) {
            alert(app.language === "jp" ? "送信しました。" : "Message sent.");
            event.target.reset();
          } else {
            alert(app.language === "jp" ? "送信に失敗しました。" : "Submission failed.");
          }
        } catch (error) {
          alert(app.language === "jp" ? "接続エラーです。" : "Network error.");
        } finally {
          submitButton.disabled = false;
          submitButton.style.opacity = "1";
        }
        return;
      }

      const body = encodeURIComponent(`Name: ${fullName}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:${app.emailReceiver}?subject=${encodeURIComponent(subject)}&body=${body}`;
    });
  }

  initEvents();
  applyLanguage();

  window.addEventListener("hashchange", handleHashChange);

  if (window.location.hash) {
    handleHashChange();
  } else {
    window.location.hash = "work";
  }
})();