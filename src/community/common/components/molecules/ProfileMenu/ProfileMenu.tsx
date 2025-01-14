import { Typography } from "@mui/material";
import { Box, Stack } from "@mui/system";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { JSX } from "react";

import { useGetUploadedImage } from "~community/common/api/FileHandleApi";
import ROUTES from "~community/common/constants/routes";
import { appBarTestId } from "~community/common/constants/testIds";
import { FileTypes } from "~community/common/enums/CommonEnums";
import { ButtonStyle } from "~community/common/enums/ComponentEnums";
import { useTranslator } from "~community/common/hooks/useTranslator";
import { theme } from "~community/common/theme/theme";
import { AdminTypes, ManagerTypes } from "~community/common/types/AuthTypes";
import { IconName } from "~community/common/types/IconTypes";
import { usePeopleStore } from "~community/people/store/store";

import Button from "../../atoms/Button/Button";
import Icon from "../../atoms/Icon/Icon";
import Avatar from "../Avatar/Avatar";

interface Props {
  handleCloseMenu: any;
}

const ProfileMenu = ({ handleCloseMenu }: Props): JSX.Element => {
  const router = useRouter();
  const translateText = useTranslator("appBar");
  const { data: session } = useSession();
  const employee = session?.user?.employee;
  const isPeopleManagerOrSuperAdmin = session?.user.roles?.includes(
    ManagerTypes.PEOPLE_MANAGER || AdminTypes.SUPER_ADMIN
  );
  const { setSelectedEmployeeId } = usePeopleStore((state) => state);

  const handelViewAccount = async () => {
    if (isPeopleManagerOrSuperAdmin) {
      setSelectedEmployeeId(employee?.employeeId as unknown as string);
      await router.push(
        ROUTES.PEOPLE.EDIT_ALL_INFORMATION(employee?.employeeId)
      );
    } else {
      router.push(ROUTES.PEOPLE.ACCOUNT);
    }

    handleCloseMenu();
  };

  const handleSignOut = async () => {
    await signOut({ redirect: true });
  };

  const { data: logoUrl } = useGetUploadedImage(
    FileTypes.USER_IMAGE,
    employee?.authPic,
    true
  );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={2}
      >
        <Stack
          direction="row"
          justifyContent="center"
          alignItems="center"
          spacing={2}
        >
          <Box>
            <Avatar
              firstName={session?.user?.employee?.firstName || ""}
              lastName={session?.user?.employee?.lastName || ""}
              alt={`${session?.user?.employee?.firstName} ${session?.user?.employee?.lastName}`}
              src={logoUrl || ""}
            />
          </Box>
          <Stack>
            <Typography variant="h3">
              {session?.user?.employee?.firstName}{" "}
              {session?.user?.employee?.lastName}
            </Typography>
            <Typography
              variant="body2"
              color={theme.palette.text.secondary}
              sx={{ fontSize: 13, fontWeight: 400 }}
            >
              {employee?.jobTitle}
            </Typography>
          </Stack>
        </Stack>
        <Button
          buttonStyle={ButtonStyle.TERTIARY}
          endIcon={<Icon name={IconName.RIGHT_ARROW_ICON} />}
          label={translateText(["viewAccount"])}
          styles={{
            mt: "1rem",
            width: "40%",
            py: "0.5rem",
            px: "0.75rem",
            fontWeight: 500,
            fontSize: "0.75rem"
          }}
          onClick={handelViewAccount}
          isFullWidth={false}
          data-testid={appBarTestId.appBar.viewAccountBtn}
        />
      </Stack>
      <Button
        buttonStyle={ButtonStyle.TERTIARY}
        startIcon={<Icon name={IconName.SIGNOUT_ICON} />}
        label={translateText(["logout"])}
        styles={{ mt: "1rem" }}
        onClick={handleSignOut}
      />
    </Box>
  );
};

export default ProfileMenu;
