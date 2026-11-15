{
  "wallTime": 13,
  "cpuTime": 12,
  "truncated": false,
  "executionModel": "stateless",
  "outcome": "ok",
  "scriptVersion": {
    "id": "464933bc-0813-41ce-855a-2f8ee833d1ce"
  },
  "scriptName": "pages-worker--24000239-production",
  "diagnosticsChannelEvents": [],
  "exceptions": [],
  "logs": [
    {
      "message": [
        "Staff create failed",
        "NotSupportedError: Pbkdf2 failed: iteration counts above 100000 are not supported (requested 180000)."
      ],
      "level": "error",
      "timestamp": 1794723124302
    }
  ],
  "eventTimestamp": 1794723124301,
  "event": {
    "request": {
      "url": "https://donedeal-51i.pages.dev/api/admin/support-staff",
      "method": "POST",
      "headers": {
        "accept": "*/*",
        "accept-encoding": "gzip, br",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "cf-connecting-ip": "136.158.124.1",
        "cf-ipcountry": "PH",
        "cf-ray": "a5ac1a266c1bfc72",
        "cf-visitor": "{\"scheme\":\"https\"}",
        "connection": "Keep-Alive",
        "content-length": "184",
        "content-type": "application/json",
        "cookie": "REDACTED",
        "host": "donedeal-51i.pages.dev",
        "origin": "https://donedeal-51i.pages.dev",
        "pragma": "no-cache",
        "priority": "u=1, i",
        "referer": "https://donedeal-51i.pages.dev/admin/support-staff?utm_source=chatgpt.com",
        "sec-ch-ua": "\"Not;A=Brand\";v=\"8\", \"Chromium\";v=\"150\", \"Google Chrome\";v=\"150\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"macOS\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
        "x-forwarded-proto": "https",
        "x-real-ip": "136.158.124.1"
      },
      "cf": {
        "httpProtocol": "HTTP/3",
        "clientAcceptEncoding": "gzip, deflate, br",
        "requestPriority": "",
        "edgeRequestKeepAliveStatus": 1,
        "requestHeaderNames": [
          ":method",
          ":authority",
          ":scheme",
          ":path",
          "content-length",
          "pragma",
          "cache-control",
          "sec-ch-ua-platform",
          "user-agent",
          "sec-ch-ua",
          "content-type",
          "sec-ch-ua-mobile",
          "accept",
          "origin",
          "sec-fetch-site",
          "sec-fetch-mode",
          "sec-fetch-dest",
          "referer",
          "accept-encoding",
          "accept-language",
          "cookie",
          "cookie",
          "priority"
        ],
        "clientTcpRtt": 0,
        "clientQuicRtt": 9,
        "colo": "MNL",
        "asn": 17639,
        "asOrganization": "Converge ICT Network",
        "country": "PH",
        "isEUCountry": false,
        "city": "Siclong",
        "continent": "AS",
        "region": "Central Luzon",
        "regionCode": "03",
        "timezone": "Asia/Manila",
        "longitude": "121.2239",
        "latitude": "15.5808",
        "postalCode": "3129",
        "tlsVersion": "TLSv1.3",
        "tlsCipher": "AEAD-AES128-GCM-SHA256",
        "tlsClientRandom": "NOMm1Lu5rikv65BivlZEDXMGCpf2ZkXY7UfgAFgcXQc=",
        "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
        "tlsClientExtensionsSha1": "9dyA6uAP0aqZ6Apl4tG5UoLUK2w=",
        "tlsClientExtensionsSha1Le": "8EPoARbWnzKM9mDnDhK+WtxPydU=",
        "tlsClientHelloLength": "1733",
        "tlsClientAuth": {
          "certPresented": "0",
          "certVerified": "NONE",
          "certRevoked": "0",
          "certIssuerDN": "",
          "certSubjectDN": "",
          "certIssuerDNRFC2253": "",
          "certSubjectDNRFC2253": "",
          "certIssuerDNLegacy": "",
          "certSubjectDNLegacy": "",
          "certSerial": "",
          "certIssuerSerial": "",
          "certSKI": "",
          "certIssuerSKI": "",
          "certFingerprintSHA1": "",
          "certFingerprintSHA256": "",
          "certNotBefore": "",
          "certNotAfter": "",
          "certRFC9440": "",
          "certRFC9440TooLarge": false,
          "certChainRFC9440": "",
          "certChainRFC9440TooLarge": false
        },
        "verifiedBotCategory": "",
        "edgeL4": {
          "deliveryRate": 155542
        },
        "pagesHostName": "donedeal-51i.pages.dev",
        "botManagement": {
          "corporateProxy": false,
          "verifiedBot": false,
          "jsDetection": {
            "passed": false
          },
          "staticResource": false,
          "detectionIds": {},
          "score": 99
        }
      }
    },
    "response": {
      "status": 409
    }
  },
  "id": 0
}
