export class InquirerService {
  constructor(
    public input: typeof import("@inquirer/prompts").input,
    public select: typeof import("@inquirer/prompts").select
  ) {}

  public async answer() {
    const answers = {
      workspace: await this.input({
        theme: { prefix: "~" },
        message:
          "Enter your desired workspace name (eg, input acme for an `@acme/*` naming convention)",
        validate(value) {
          if (/( )/g.test(value) === true) {
            return `"value must not include spaces; received value of "${value}"`;
          }
          if (/([A-Z])/g.test(value) === true) {
            return `workspace name must begin with a lowercase letter and only use a combination of dashes (-), lowercase letters, and numbers; invalid value of "${value}"`;
          }
          if (
            /(\\|\*|\.|\/|~|!|,|#|@|\$|%|\^|&|\(|\)|_|\{|\}|\||`|\[|\]|>|<|\+|=|;|:|"|')/g.test(
              value
            ) === true
          ) {
            return `workspace name must not include any special characters other than the dash "-" character; received invalid value of "${value}"`;
          } else return true;
        },
        required: true
      }),
      withVercel: await this.select({
        theme: { prefix: "~" },
        message: "Will this app be deployed to Vercel?",
        choices: [
          { name: "Yes", value: true },
          { name: "No", value: false }
        ],
        default: undefined
      }),
      domain: await this.input({
        theme: { prefix: "~" },
        message:
          "What domain will this be hosted on in production? (if unknown press enter)",
        required: false,
        default: "unknown.com",
        validate(s) {
          const raw = s.trim();
          const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
            ? raw
            : `https://${raw}`;
          if (!URL.canParse(candidate)) {
            return `"${s}" isn't parseable as a domain — try the bare hostname, e.g. chat.aicoalesce.com`;
          }
          if (new URL(candidate).hostname.length === 0) {
            return `couldn't derive a hostname from "${s}" — try e.g. chat.aicoalesce.com`;
          }
          return true;
        }
      }),
      previewDomain: await this.input({
        theme: { prefix: "~" },
        message:
          "What domain will this be hosted on in preview? (if unknown press enter)",
        required: false,
        default: "preview-unknown.com",
        validate(s) {
          const raw = s.trim();
          const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
            ? raw
            : `https://${raw}`;
          if (!URL.canParse(candidate)) {
            return `"${s}" isn't parseable as a domain — try the bare hostname, e.g. chat.aicoalesce.com`;
          }
          if (new URL(candidate).hostname.length === 0) {
            return `couldn't derive a hostname from "${s}" — try e.g. chat.aicoalesce.com`;
          }
          return true;
        }
      }),
      port: await this.input({
        theme: { prefix: "~" },
        message: "Which port should be used for your nextjs web application?",
        required: false,
        default: "3000",
        validate(value) {
          if (
            /^(?:6553[0-5]|655[0-2]\d|65[0-4]\d{2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3})$/g.test(
              value
            ) === true &&
            (value.substring(0).length <= 3 || value.substring(0).length > 5)
          ) {
            return `please input a value that is 4-to-5 digits in length for your port of choice, received value of "${value}"`;
          }
          return true;
        }
      })
    };
    return answers;
  }

  public executeInquirer() {
    return this.answer();
  }
}
