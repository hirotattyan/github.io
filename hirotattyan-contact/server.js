const express = require("express");
const path = require("node:path");

const app = express();
const port = 3000;

app.use(express.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, "public")));

app.post("/contact",(req,res) => {
    const { name,email,inquiryType,message } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof inquiryType !== "string" ||
        typeof message !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !inquiryType.trim() ||
        !message.trim() 
    ) {
        return res.status(400).send("必須項目を入力してください")
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
        return res.status(400).send(
            "メールアドレスの形式を確認してください。"
        );
    }

    const allowedTypes = [
        "new-website",
        "website-renewal",
        "wordpress",
        "other"
    ];

    if(!allowedTypes.includes(inquiryType)) {
        return res.status(400).send(
            "ご相談の種類を選択し直してください"
        );
    }

    const detailKeys = {
        "new-website": ["websitePurpose","pageCount"],
        "website-renewal": ["renewalUrl","renewalType"],
        "wordpress":["wordpressUrl","wordpressTask"],
        "other":[]
    };

    const details ={};

    for (const key of detailKeys[inquiryType]) {
        const value = req.body[key];

        if (value !== undefined && typeof value !=="string") {
            return res.status(400).send(
                "入力内容の形式を確認してください。"
            );
        }
        details[key] = (value ?? "").trim();
    }

    const siteUrl = details.renewalUrl ?? details.wordpressUrl ?? "";

    if(siteUrl !=="") {
        let parsedUrl;

        try {
            parsedUrl = new URL(siteUrl);
        }catch{
            return res.status(400).send(
                "サイトURLをhttps:// または http:// から入力してください。"
            );
        }

        if(
            parsedUrl.protocol !== "https:"&&
            parsedUrl.protocol !== "http:"
        ){
            return res.status(400).send(
                "サイトURLはhttps:// または http:// から入力してください。"
            );
        }
    }

    const allowedDetailValues = {
        websitePurpose:["","business","portfolio","personal","other"],
        pageCount: ["","1","2-5","6+"],
        renewalType: ["","responsive","design","content","renewal","other"],
        wordpressTask: ["","setup","design","content","trouble","other"]
    };

    for(const [key,allowedValues] of Object.entries(allowedDetailValues))
    {
        if(
            Object.hasOwn(details,key) &&
            !allowedValues.includes(details[key])
        ){
            return res.status(400).send(
                "選択項目の内容を確認してください。"
            );
        }
    }

const inquiryLabels = {
    "new-website" : "ホームページの新規制作",
    "website-renewal" : "既存ホームページの修正・リニューアル",
    "wordpress" : "Wordpressに関するご相談",
    "other" : "その他のご相談"
};

const detailLabels = {
    websitePurpose: "ホームページの制作目的",
    pageCount: "希望するページ数",
    renewalUrl: "現在のホームページURL",
    renewalType: "ご希望の修正内容",
    wordpressUrl:"現在のサイトURL",
    wordpressTask: "ご希望の作業"
};

const valueLabels = {
    websitePurpose: {
        business: "事業・サービスの紹介",
        portfolio: "ポートフォリオ・実績紹介",
        personal: "個人・趣味のホームページ",
        other: "その他"
    },

    pageCount: {
        "1": "1ページ",
        "2-5": "2~5ページ",
        "6+": "6ページ以上"
    },

    renewalType: {
        responsive: "スマートフォン対応",
        design: "デザイン・レイアウトの変更",
        content: "文章・画像などの修正",
        renewal: "ホームページ全体のリニューアル",
        other:"その他"
    },

    wordpressTask: {
        setup: "WordPressの新規導入",
        design: "デザイン・レイアウトの変更",
        content: "文章・画像などの更新",
        trouble: "不具合の修正",
        other: "その他・相談したい"
    }
};

const detailLines = Object.entries(details).map(([key,value]) => {
    const displayValue = value ===""
            ?"未入力・未選択"
            :(valueLabels[key]?.[value] ?? value);

    return `${detailLabels[key]}:${displayValue}`;
});

const mailText = [
    "お問い合わせが届きました。",
    "",
    `お名前:${name.trim()}`,
    `メールアドレス：${email.trim()}`,
    `ご相談の種類:${inquiryLabels[inquiryType]}`,
    ...detailLines,
    "",
    "【お問合せ内容】",
    message.trim()
].join("\n");

    res.send("お問い合わせ内容を受け取りました。まだメールは送信されていません")
});

app.listen(port, "127.0.0.1", () => {
    console.log(`サーバー起動：http://127.0.0.1:${port}`);
});