import CloudIcon from "@mui/icons-material/Cloud";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import useSchoiceStore from "../../../store/Schoice.store";
import { supabase } from "../../../tools/supabase";

const CloudSync: React.FC = () => {
  const [updateAt, setUpdateAt] = useState("N/A");
  const schoiceStore = useSchoiceStore();

  const handleSync = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const bulls = schoiceStore.bulls;
    const bears = schoiceStore.bears;

    // 組裝 bulls
    const bullArr = Object.values(bulls).map((item) => ({
      user_id: user?.id,
      prompt_type: "bulls",
      prompt_name: item.name,
      conditions: JSON.stringify(item.conditions),
    }));
    // 組裝 bears
    const bearArr = Object.values(bears).map((item) => ({
      user_id: user?.id,
      prompt_type: "bears",
      prompt_name: item.name,
      conditions: JSON.stringify(item.conditions),
    }));

    // 推送到 supabase 的 user_prompts table
    const { error: bullError } = await supabase
      .from("user_prompts")
      .insert(bullArr);
    const { error: bearError } = await supabase
      .from("user_prompts")
      .insert(bearArr);

    if (bullError || bearError) {
      console.error("推送失敗", bullError, bearError);
    } else {
      fetchStockTable();
    }
  };

  async function fetchStockTable() {
    const { data, error } = await supabase.from("user_prompts").select();
    if (error) {
      console.error("取得 stock table 失敗:", error);
      return [];
    }
    console.log(data);
  }

  useEffect(() => {
    fetchStockTable();
  }, []);

  return (
    <Grid size={6}>
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} mb={1}>
            <CloudIcon sx={{ color: "white" }} />
            <Typography variant="h6" fontWeight="bold">
              雲端同步
            </Typography>
          </Stack>

          <Stack
            direction="row"
            alignItems="flex-end"
            justifyContent="space-between"
            spacing={1}
            mt={2}
          >
            <Box>
              <Typography variant="body2" gutterBottom>
                上次更新時間 {updateAt}
              </Typography>
              <Button variant="contained" color="primary" onClick={handleSync}>
                同步本地資料到雲端
              </Button>
            </Box>
            <Box>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setUpdateAt(new Date().toLocaleString())}
              >
                雲端鏡像到本地
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default CloudSync;
