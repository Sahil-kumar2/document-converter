import ToolPageLayout from '../../components/ToolPageLayout'
import CropPdfPanel from '../../components/CropPdfPanel'

export default function CropPdfPage() {
  return (
    <ToolPageLayout
      title="Crop PDF"
      icon="🔪"
      description="Remove unwanted areas from your PDF pages. Draw precisely with your mouse."
      acceptedFiles=".pdf"
      ToolComponent={CropPdfPanel}
    />
  )
}
