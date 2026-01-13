import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DocModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  markdown: string;
}

const DocModal: React.FC<DocModalProps> = ({
  open,
  onClose,
  title,
  markdown,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "background.paper",
          backgroundImage: "none",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box
          sx={{
            "& h1": { mt: 0, mb: 2, fontSize: "1.5rem" },
            "& h2": {
              mt: 3,
              mb: 1,
              fontSize: "1.25rem",
              color: "primary.main",
            },
            "& h3": { mt: 2, mb: 1, fontSize: "1.1rem" },
            "& p": { mb: 2, lineHeight: 1.6, opacity: 0.9 },
            "& ul, & ol": { mb: 2, pl: 3 },
            "& li": { mb: 1, opacity: 0.9 },
            "& table": {
              width: "100%",
              borderCollapse: "collapse",
              mb: 3,
              fontSize: "0.9rem",
            },
            "& th, & td": {
              border: "1px solid rgba(255, 255, 255, 0.1)",
              p: 1.5,
              textAlign: "left",
            },
            "& th": { bgcolor: "rgba(255, 255, 255, 0.05)" },
            "& hr": {
              my: 3,
              border: 0,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            },
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DocModal;
