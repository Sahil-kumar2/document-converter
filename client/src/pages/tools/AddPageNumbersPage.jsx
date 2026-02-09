import React from "react";
import ToolPageLayout from "../../components/ToolPageLayout";
import AddPageNumbersPanel from "../../components/AddPageNumbersPanel";

export default function AddPageNumbersPage() {
  return (
    <ToolPageLayout
      title="Add Page Numbers"
      icon="🔢"
      description="Add page numbers to your PDF with customizable position, format, and styling"
      acceptedFiles=".pdf"
      ToolComponent={AddPageNumbersPanel}
    />
  );
}
