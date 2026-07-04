# Accessibility Report

Violations: 3
[
  {
    "id": "landmark-one-main",
    "impact": "moderate",
    "tags": [
      "cat.semantics",
      "best-practice"
    ],
    "description": "Ensure the document has a main landmark",
    "help": "Document should have one main landmark",
    "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/landmark-one-main?application=playwright",
    "nodes": [
      {
        "any": [],
        "all": [
          {
            "id": "page-has-main",
            "data": null,
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Document does not have a main landmark"
          }
        ],
        "none": [],
        "impact": "moderate",
        "html": "<html lang=\"en\">",
        "target": [
          "html"
        ],
        "failureSummary": "Fix all of the following:\n  Document does not have a main landmark"
      }
    ]
  },
  {
    "id": "page-has-heading-one",
    "impact": "moderate",
    "tags": [
      "cat.semantics",
      "best-practice"
    ],
    "description": "Ensure that the page, or at least one of its frames contains a level-one heading",
    "help": "Page should contain a level-one heading",
    "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/page-has-heading-one?application=playwright",
    "nodes": [
      {
        "any": [],
        "all": [
          {
            "id": "page-has-heading-one",
            "data": null,
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Page must have a level-one heading"
          }
        ],
        "none": [],
        "impact": "moderate",
        "html": "<html lang=\"en\">",
        "target": [
          "html"
        ],
        "failureSummary": "Fix all of the following:\n  Page must have a level-one heading"
      }
    ]
  },
  {
    "id": "region",
    "impact": "moderate",
    "tags": [
      "cat.keyboard",
      "best-practice",
      "RGAAv4",
      "RGAA-9.2.1"
    ],
    "description": "Ensure all page content is contained by landmarks",
    "help": "All page content should be contained by landmarks",
    "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/region?application=playwright",
    "nodes": [
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<span class=\"text-white/95 font-bold text-[17px] tracking-wide relative z-10 transition-all duration-200 opacity-100\">AutoUploader</span>",
        "target": [
          ".text-white\\/95"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"p-3 shrink-0 relative z-10 mb-2 overflow-hidden whitespace-nowrap\">",
        "target": [
          ".p-3"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"flex flex-col justify-center\">",
        "target": [
          ".gap-4.z-10.relative > .flex-col.justify-center.flex"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-white text-[18px] font-bold tracking-tight mb-0 drop-shadow-md\">Everything is</div>",
        "target": [
          ".text-\\[18px\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-cyan-500 text-[26px] font-black mb-1.5 tracking-tight drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]\">running smoothly.</div>",
        "target": [
          ".text-transparent"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<p class=\"text-white/70 text-[13px] font-medium mr-2\">Your content pipeline is performing beautifully.</p>",
        "target": [
          ".text-white\\/70"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[12px] font-semibold text-white/60 leading-tight mb-1 whitespace-normal max-w-full\">Connected Channels</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(1) > .min-w-0.flex-1.flex-col > .text-white\\/60.mb-1.whitespace-normal"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-2xl font-bold text-white tracking-tight drop-shadow-sm leading-none\">1</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(1) > .min-w-0.flex-1.flex-col > .text-2xl.leading-none.tracking-tight"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[11px] font-semibold flex items-center gap-1.5 text-amber-400\"><span class=\"truncate\">Active accounts</span></div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(1) > .min-w-0.flex-1.flex-col > .mt-2.justify-between.items-center > .text-amber-400.text-\\[11px\\].gap-1\\.5"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[12px] font-semibold text-white/60 leading-tight mb-1 whitespace-normal max-w-full\">Videos Waiting</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(2) > .min-w-0.flex-1.flex-col > .text-white\\/60.mb-1.whitespace-normal"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-2xl font-bold text-white tracking-tight drop-shadow-sm leading-none\">0</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(2) > .min-w-0.flex-1.flex-col > .text-2xl.leading-none.tracking-tight"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[11px] font-semibold flex items-center gap-1.5 text-amber-400\"><span class=\"truncate\">Needs review</span></div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(2) > .min-w-0.flex-1.flex-col > .mt-2.justify-between.items-center > .text-amber-400.text-\\[11px\\].gap-1\\.5"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[12px] font-semibold text-white/60 leading-tight mb-1 whitespace-normal max-w-full\">Uploading Now</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(3) > .min-w-0.flex-1.flex-col > .text-white\\/60.mb-1.whitespace-normal"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-2xl font-bold text-white tracking-tight drop-shadow-sm leading-none\">0</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(3) > .min-w-0.flex-1.flex-col > .text-2xl.leading-none.tracking-tight"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[11px] font-semibold flex items-center gap-1.5 text-amber-400\"><span class=\"truncate\">In progress</span></div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(3) > .min-w-0.flex-1.flex-col > .mt-2.justify-between.items-center > .text-amber-400.text-\\[11px\\].gap-1\\.5"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-[12px] font-semibold text-white/60 leading-tight mb-1 whitespace-normal max-w-full\">Completed</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(4) > .min-w-0.flex-1.flex-col > .text-white\\/60.mb-1.whitespace-normal"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"text-2xl font-bold text-white tracking-tight drop-shadow-sm leading-none\">0</div>",
        "target": [
          ".bg-\\[\\#080b12\\]\\/60.p-4.hover\\:bg-\\[\\#0a0f18\\]\\/80:nth-child(4) > .min-w-0.flex-1.flex-col > .text-2xl.leading-none.tracking-tight"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<span class=\"truncate\">Successfully uploaded</span>",
        "target": [
          ".text-green-400 > .truncate"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"bg-[#05080e]/60 backdrop-blur-2xl border border-white/[0.08] rounded-[24px] p-5 flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]\">",
        "target": [
          ".rounded-\\[24px\\].p-5.shadow-\\[0_8px_32px_rgba\\(0\\,0\\,0\\,0\\.4\\)\\]:nth-child(1)"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<h2 class=\"text-white font-bold text-[15px] mb-4 shrink-0 tracking-wide\">Quick Actions</h2>",
        "target": [
          ".rounded-\\[24px\\].p-5.shadow-\\[0_8px_32px_rgba\\(0\\,0\\,0\\,0\\.4\\)\\]:nth-child(2) > .text-\\[15px\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<span class=\"text-white font-bold text-[14px] tracking-wide group-hover:text-cyan-300 transition-colors drop-shadow-sm truncate\">Import Videos</span>",
        "target": [
          ".bg-\\[\\#0d121c\\]\\/60.backdrop-blur-xl.border-white\\/\\[0\\.06\\]:nth-child(1) > .min-w-0.flex-1.gap-4 > .group-hover\\:text-cyan-300.drop-shadow-sm.text-\\[14px\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<span class=\"text-white font-bold text-[14px] tracking-wide group-hover:text-cyan-300 transition-colors drop-shadow-sm truncate\">Review Queue</span>",
        "target": [
          ".bg-\\[\\#0d121c\\]\\/60.backdrop-blur-xl.border-white\\/\\[0\\.06\\]:nth-child(2) > .min-w-0.flex-1.gap-4 > .group-hover\\:text-cyan-300.drop-shadow-sm.text-\\[14px\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<span class=\"text-white font-bold text-[14px] tracking-wide group-hover:text-cyan-300 transition-colors drop-shadow-sm truncate\">Manage Channels</span>",
        "target": [
          ".bg-\\[\\#0d121c\\]\\/60.backdrop-blur-xl.border-white\\/\\[0\\.06\\]:nth-child(3) > .min-w-0.flex-1.gap-4 > .group-hover\\:text-cyan-300.drop-shadow-sm.text-\\[14px\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<span class=\"text-white font-bold text-[14px] tracking-wide group-hover:text-cyan-300 transition-colors drop-shadow-sm truncate\">Preferences</span>",
        "target": [
          ".bg-\\[\\#0d121c\\]\\/60.backdrop-blur-xl.border-white\\/\\[0\\.06\\]:nth-child(4) > .min-w-0.flex-1.gap-4 > .group-hover\\:text-cyan-300.drop-shadow-sm.text-\\[14px\\]"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"flex justify-between items-start mb-2 z-10 shrink-0\">",
        "target": [
          ".items-start.mb-2.justify-between"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      },
      {
        "any": [
          {
            "id": "region",
            "data": {
              "isIframe": false
            },
            "relatedNodes": [],
            "impact": "moderate",
            "message": "Some page content is not contained by landmarks"
          }
        ],
        "all": [],
        "none": [],
        "impact": "moderate",
        "html": "<div class=\"mt-1 border-t border-white/[0.04] pt-3 flex items-center justify-between shrink-0\">",
        "target": [
          ".mt-1"
        ],
        "failureSummary": "Fix any of the following:\n  Some page content is not contained by landmarks"
      }
    ]
  }
]