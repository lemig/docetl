import React from "react";
import { HelpCircle, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface OperationHelpButtonProps {
  type: string;
}

export const OperationHelpButton: React.FC<OperationHelpButtonProps> = ({
  type,
}) => {
  const [copiedPrompt, setCopiedPrompt] = React.useState<string | null>(null);

  const handleCopy = async (text: string, promptId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPrompt(promptId);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const PromptBlock = ({ text, id }: { text: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-slate-100 p-2 rounded text-sm whitespace-pre-wrap font-mono">
        {text}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => handleCopy(text, id)}
      >
        {copiedPrompt === id ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  const getExamplePrompt = () => {
    switch (type) {
      case "map":
        return (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                The prompt runs once per document. Each document is available as{" "}
                <span className="font-mono">input</span>, and you can reference
                specific fields with dot notation:
              </p>
              <div className="space-y-2">
                <p>Reference the entire document:</p>
                <PromptBlock
                  text={"Analyze this: {{ input }}"}
                  id="map-example"
                />
                <p>
                  Or reference specific fields (e.g., if your document has a
                  "text" field):
                </p>
                <PromptBlock
                  text={"Analyze this text: {{ input.text }}"}
                  id="map-specific"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">
                What&apos;s the output schema?
              </p>
              <div className="border rounded p-3">
                <p className="text-sm">
                  The schema defines what new columns the LLM should add to each
                  document. For example:
                </p>
                <div className="mt-2 pl-4 text-sm text-muted-foreground">
                  Column: <span className="font-mono">summary</span>
                  <br />
                  Type: <span className="font-mono">string</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Each document will keep its existing columns and get this new
                  column.
                </p>
              </div>
            </div>
          </div>
        );

      case "filter":
        return (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                The prompt runs once per document. Each document is available as{" "}
                <span className="font-mono">input</span>, and you can reference
                specific fields with dot notation:
              </p>
              <div className="space-y-2">
                <p>Reference the entire document:</p>
                <PromptBlock
                  text={"Should we keep this? {{ input }}"}
                  id="filter-example"
                />
                <p>
                  Or reference specific fields (e.g., if your document has a
                  "content" field):
                </p>
                <PromptBlock
                  text={"Is this content relevant? {{ input.content }}"}
                  id="filter-specific"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">
                What&apos;s the output schema?
              </p>
              <div className="border rounded p-3">
                <p className="text-sm">
                  For filter operations, the schema must be a single boolean
                  column that determines if the document should be kept:
                </p>
                <div className="mt-2 pl-4 text-sm text-muted-foreground">
                  Column: <span className="font-mono">keep_document</span>
                  <br />
                  Type: <span className="font-mono">boolean</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Documents where this column is true will be kept, others will
                  be filtered out.
                </p>
              </div>
            </div>
          </div>
        );

      case "reduce":
        return (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">
                The prompt runs once per group of documents. Each document in
                the group is available in the{" "}
                <span className="font-mono">inputs</span> list, and you can
                reference specific fields with dot notation:
              </p>
              <div className="space-y-2">
                <p>Reference entire documents:</p>
                <PromptBlock
                  text={
                    "Analyze these documents:\n\n{% for input in inputs %}\nDocument: {{ input }}\n{% endfor %}"
                  }
                  id="reduce-example"
                />
                <p>
                  Or reference specific fields (e.g., if your documents have a
                  "title" field):
                </p>
                <PromptBlock
                  text={
                    "Analyze these documents:\n\n{% for input in inputs %}\nTitle: {{ input.title }}\n{% endfor %}"
                  }
                  id="reduce-specific"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">
                What&apos;s the output schema?
              </p>
              <div className="border rounded p-3">
                <p className="text-sm">
                  The schema defines the columns for a new row that represents
                  the entire group:
                </p>
                <div className="mt-2 pl-4 text-sm text-muted-foreground">
                  Column: <span className="font-mono">combined_analysis</span>
                  <br />
                  Type: <span className="font-mono">string</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Each group will produce one new row containing just these
                  output columns.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <HelpCircle className="h-4 w-4 text-gray-600" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px]" align="start">
        <div className="space-y-4">
          <h4 className="font-medium">Example Prompts</h4>
          {getExamplePrompt()}
          <div className="text-sm text-muted-foreground">
            <p>
              You can find available input keys in the Dataset View (top right
              corner).
            </p>
            <p className="mt-2">
              For more details, see the{" "}
              <a
                href={`https://ucbepic.github.io/docetl/operators/${type}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {type} operator documentation
              </a>
              .
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
