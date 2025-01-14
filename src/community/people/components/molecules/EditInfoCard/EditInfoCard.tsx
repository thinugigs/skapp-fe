import { Stack, type SxProps, Typography } from "@mui/material";
import { type Theme, useTheme } from "@mui/material/styles";
import { useSession } from "next-auth/react";
import { JSX } from "react";
import {
  type MouseEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { useDropzone } from "react-dropzone";

import { useStorageAvailability } from "~community/common/api/StorageAvailabilityApi";
import LocalPhoneIcon from "~community/common/assets/Icons/LocalPhoneIcon";
import MailIcon from "~community/common/assets/Icons/MailIcon";
import BasicChip from "~community/common/components/atoms/Chips/BasicChip/BasicChip";
import Icon from "~community/common/components/atoms/Icon/Icon";
import Avatar from "~community/common/components/molecules/Avatar/Avatar";
import AvatarChip from "~community/common/components/molecules/AvatarChip/AvatarChip";
import BasicChipGroup from "~community/common/components/molecules/BasicChipGroup/BasicChipGroup";
import KebabMenu from "~community/common/components/molecules/KebabMenu/KebabMenu";
import { useScreenSizeRange } from "~community/common/hooks/useScreenSizeRange";
import { useTranslator } from "~community/common/hooks/useTranslator";
import { useToast } from "~community/common/providers/ToastProvider";
import { ROLE_SUPER_ADMIN } from "~community/common/types/AuthTypes";
import { ManagerTypes } from "~community/common/types/CommonTypes";
import { IconName } from "~community/common/types/IconTypes";
import {
  formatDateWithOrdinalIndicator,
  getTimeElapsedSinceDate
} from "~community/common/utils/dateTimeUtils";
import { EIGHTY_PERCENT } from "~community/common/utils/getConstants";
import { AccountStatusEnums } from "~community/people/enums/editResourceEnums";
import { usePeopleStore } from "~community/people/store/store";
import { ModifiedFileType } from "~community/people/types/AddNewResourceTypes";
import {
  EmployeeDetails,
  EmployeeManagerType
} from "~community/people/types/EmployeeTypes";
import { toPascalCase } from "~community/people/utils/jobFamilyUtils/commonUtils";
import {
  findHasSupervisoryRoles,
  getStatusStyle
} from "~community/people/utils/terminationUtil";

interface Props {
  selectedEmployee: EmployeeDetails;
  onClick?: MouseEventHandler<HTMLDivElement>;
  styles?: SxProps;
}

const EditInfoCard = ({
  selectedEmployee,
  onClick,
  styles
}: Props): JSX.Element => {
  const theme: Theme = useTheme();
  const {
    isDesktopScreen,
    isSmallDesktopScreen,
    isTabScreen,
    isPhoneScreen,
    isSmallPhoneScreen
  } = useScreenSizeRange();
  const translateText = useTranslator("peopleModule", "editAllInfo");
  const translateTerminationText = useTranslator("peopleModule", "termination");
  const translateStorageText = useTranslator("StorageToastMessage");
  const { data } = useSession();

  const { setToastMessage } = useToast();

  const { data: storageAvailableData } = useStorageAvailability();
  const hasTerminationAbility =
    data?.user.roles?.includes(ROLE_SUPER_ADMIN) &&
    data?.user?.employee?.employeeId.toString() !==
      selectedEmployee?.employeeId;

  const {
    employeeGeneralDetails,
    setEmployeeGeneralDetails,
    setTerminationConfirmationModalOpen,
    setAlertMessage,
    setTerminationAlertModalOpen
  } = usePeopleStore((state) => state);

  const [supervisor, setSupervisor] = useState<EmployeeManagerType | null>(
    null
  );

  const handleTermination = () => {
    const hasSupervisoryRoles = findHasSupervisoryRoles(selectedEmployee);

    if (hasSupervisoryRoles) {
      const condition = {
        managers: selectedEmployee.managers?.length || 0,
        teams: selectedEmployee.teams?.length || 0
      };

      const caseKey = `${condition.managers}-${condition.teams}`;

      switch (caseKey) {
        case "1-0":
          setAlertMessage(
            translateTerminationText([
              "terminateWarningModalDescriptionSingleEmployee"
            ])
          );
          break;

        case "0-1":
          setAlertMessage(
            translateTerminationText([
              "terminateWarningModalDescriptionSingleTeam"
            ])
          );
          break;

        default:
          if (condition.managers > 1) {
            setAlertMessage(
              translateTerminationText([
                "terminateWarningModalDescriptionMultipleEmployees"
              ])
            );
          } else if (condition.teams > 1) {
            setAlertMessage(
              translateTerminationText([
                "terminateWarningModalDescriptionMultipleTeams"
              ])
            );
          }
      }

      setTerminationAlertModalOpen(true);

      return;
    }

    setTerminationConfirmationModalOpen(true);
  };

  const kebabMenuOptions = [
    {
      id: selectedEmployee.employeeId || "",
      icon: (
        <Icon
          name={IconName.BIN_ICON}
          fill={theme.palette.error.contrastText}
        />
      ),
      text: translateTerminationText(["terminateButtonText"]),
      onClickHandler: () => handleTermination(),
      isDisabled:
        selectedEmployee.accountStatus === AccountStatusEnums.TERMINATED
    }
  ];

  const cardData = useMemo(() => {
    return {
      employeeId: selectedEmployee?.identificationNo?.toString() || "1",
      authPic: selectedEmployee?.authPic || "",
      firstName: selectedEmployee?.firstName,
      lastName: selectedEmployee?.lastName,
      fullName:
        selectedEmployee?.name?.concat(
          " ",
          selectedEmployee?.lastName as string
        ) || "",
      email: selectedEmployee?.personalEmail || "",
      phone:
        selectedEmployee?.phone?.split(" ")?.[1] ??
        (selectedEmployee?.phone || ""),
      countryCode: selectedEmployee?.phone?.split(" ")?.[0] || "",
      jobFamily: selectedEmployee?.jobFamily?.name || "",
      jobTitle: selectedEmployee?.jobTitle?.name || "",
      teams: selectedEmployee?.teams || [],
      joinedDate: selectedEmployee?.joinDate || "",
      accountStatus: selectedEmployee?.accountStatus
    };
  }, [selectedEmployee]);

  const employmentStatus = cardData?.accountStatus as AccountStatusEnums;

  const statusStyle = getStatusStyle(employmentStatus);

  const getAvailableFieldCount = (): number => {
    let count = 0;
    if (cardData?.teams) count++;
    if (cardData?.joinedDate) count++;
    if (cardData?.jobFamily) count++;
    if (supervisor) count++;
    return count;
  };

  const getTelNo = (): string => {
    return cardData?.countryCode === cardData?.phone
      ? "+".concat(cardData?.countryCode)
      : "+".concat(cardData?.countryCode).concat(" ", cardData?.phone);
  };

  const getTeams = (): string[] => {
    return cardData?.teams?.map((team) => team?.team?.teamName).sort();
  };

  const getDate = (): string => {
    return formatDateWithOrdinalIndicator(new Date(cardData?.joinedDate));
  };

  const onDrop: (acceptedFiles: File[]) => void = useCallback(
    (acceptedFiles: File[]) => {
      if (storageAvailableData?.availableSpace <= EIGHTY_PERCENT) {
        const profilePic = acceptedFiles.map((file: File) =>
          Object.assign(file, { preview: URL.createObjectURL(file) })
        );
        setEmployeeGeneralDetails("authPic", profilePic as ModifiedFileType[]);
      } else {
        setToastMessage({
          open: true,
          toastType: "error",
          title: translateStorageText(["storageTitle"]),
          description: translateStorageText(["contactAdminText"]),
          isIcon: true
        });
      }
    },
    [storageAvailableData.availableSpace, setEmployeeGeneralDetails]
  );

  const { open, getInputProps } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: {
      "image/svg+xml": [],
      "image/png": [],
      "image/jpg": [],
      "image/jpeg": []
    }
  });

  const handleUnSelectPhoto = (): void => {
    setEmployeeGeneralDetails("authPic", cardData?.authPic);
  };

  useEffect(() => {
    const supervisor = selectedEmployee?.employees?.find(
      (manager: EmployeeManagerType) =>
        manager?.managerType === ManagerTypes.PRIMARY
    );

    setSupervisor(supervisor as EmployeeManagerType);
  }, [selectedEmployee]);

  const openFileBrowser = () => {
    if (storageAvailableData?.availableSpace <= EIGHTY_PERCENT) {
      open();
    } else {
      null;
      setToastMessage({
        open: true,
        toastType: "error",
        title: translateStorageText(["storageTitle"]),
        description: translateStorageText(["contactAdminText"]),
        isIcon: true
      });
    }
  };

  return (
    <Stack
      sx={{
        mb: "2rem",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        background: theme.palette.grey[100],
        padding: "1.5rem 1rem",
        pr: "2.625rem",
        borderRadius: "0.75rem",
        gap: "1rem",
        ...styles
      }}
      onClick={onClick}
    >
      <Stack
        direction="row"
        gap="1rem"
        sx={{
          alignItems: "center"
        }}
      >
        <Avatar
          id="avatar"
          alt={cardData?.fullName}
          src={
            (employeeGeneralDetails?.authPic?.[0] as ModifiedFileType)
              ?.preview ||
            (cardData?.authPic ?? "")
          }
          avatarStyles={{
            width: "6.125rem",
            height: "6.125rem",
            border: "none"
          }}
          firstName={cardData?.firstName ?? ("" as string)}
          lastName={cardData?.lastName ?? ("" as string)}
          getInputProps={getInputProps}
          handleUnSelectPhoto={handleUnSelectPhoto}
          open={openFileBrowser}
          enableEdit
          imageUploaded={
            cardData?.authPic !==
            ((employeeGeneralDetails?.authPic as string) ?? "")
          }
        />
        <Stack direction="column" alignItems="flex-start" gap="1rem">
          <Stack direction="column" alignItems="flex-start" gap="0.125rem">
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
                lineHeight: "1.875rem"
              }}
            >
              {`${cardData?.firstName} ${cardData?.lastName}`}
            </Typography>
            <Typography
              sx={{
                fontWeight: 400,
                fontSize: "1rem",
                lineHeight: "1.5rem",
                color: theme.palette.text.secondary
              }}
            >
              {cardData?.jobTitle} {cardData?.jobFamily}
            </Typography>
          </Stack>

          <Stack
            direction={
              isDesktopScreen ||
              isSmallDesktopScreen ||
              isTabScreen ||
              isPhoneScreen ||
              isSmallPhoneScreen
                ? "column"
                : "row"
            }
            alignItems="flex-start"
            gap="0.5rem"
          >
            {cardData?.email && (
              <Stack
                direction="row"
                alignItems="center"
                gap="0.5rem"
                justifyContent={"flex-start"}
                sx={{
                  display: !cardData?.email ? "none" : "flex"
                }}
              >
                <MailIcon />
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: "0.75rem",
                    lineHeight: "1.125rem"
                  }}
                >
                  {cardData?.email}
                </Typography>
              </Stack>
            )}
            {getTelNo() !== "+" && (
              <Stack
                direction="row"
                alignItems="center"
                gap="0.5rem"
                justifyContent={"flex-start"}
              >
                <LocalPhoneIcon />
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: "0.75rem",
                    lineHeight: "1.125rem"
                  }}
                >
                  {getTelNo()}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Stack
        direction={
          isPhoneScreen || isSmallPhoneScreen || getAvailableFieldCount() === 2
            ? "column"
            : "row"
        }
        gap={
          isTabScreen ||
          isPhoneScreen ||
          isSmallPhoneScreen ||
          getAvailableFieldCount() === 2
            ? "1rem"
            : "2.25rem"
        }
      >
        <Stack direction="column" alignItems="flex-start" gap="1rem">
          {cardData?.teams?.length > 0 && (
            <Stack
              direction="column"
              alignItems="flex-start"
              gap="0.25rem"
              justifyContent={"flex-start"}
            >
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: "0.75rem",
                  lineHeight: "1.125rem"
                }}
              >
                {translateText(["teams"])}
              </Typography>
              <BasicChipGroup
                values={getTeams()}
                chipStyles={{
                  color: "common.black",
                  fontWeight: 400,
                  fontSize: "0.75rem",
                  lineHeight: "1rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor: theme.palette.grey[200],
                  borderRadius: "4rem"
                }}
                max={3}
                showHoverModal
                modalPosition={"right"}
              />
            </Stack>
          )}
          {cardData?.joinedDate && (
            <Stack
              direction="column"
              alignItems="flex-start"
              gap="0.25rem"
              justifyContent={"flex-start"}
            >
              <Typography
                sx={{
                  fontWeight: 400,
                  fontSize: "0.75rem",
                  lineHeight: "1.125rem"
                }}
              >
                {translateText(["joinedDate"])}
              </Typography>
              <Stack
                direction={
                  isPhoneScreen || isSmallPhoneScreen ? "column" : "row"
                }
                gap={
                  isPhoneScreen || isSmallPhoneScreen ? "0.25rem" : "0.625rem"
                }
                alignItems={
                  isPhoneScreen || isSmallPhoneScreen ? "flex-start" : "center"
                }
              >
                <Typography
                  sx={{
                    fontWeight: 400,
                    fontSize: "0.875rem",
                    lineHeight: "1.3125rem"
                  }}
                >
                  {getDate()}
                </Typography>
                <BasicChip
                  label={getTimeElapsedSinceDate(cardData?.joinedDate)}
                  chipStyles={{
                    color: "common.black",
                    fontWeight: 400,
                    fontSize: "0.75rem",
                    lineHeight: "1rem",
                    padding: "0.25rem 0.5rem",
                    backgroundColor: theme.palette.grey[200],
                    borderRadius: "4rem"
                  }}
                />
              </Stack>
            </Stack>
          )}
        </Stack>

        <Stack direction="column" justifyContent={"space-between"} gap="1rem">
          <Stack direction="column" justifyContent={"space-between"} gap="1rem">
            <Stack
              direction="column"
              alignItems="flex-start"
              gap="0.25rem"
              justifyContent={"flex-start"}
            >
              <Stack
                direction="row"
                justifyContent={"space-between"}
                alignItems={"center"}
                width="100%"
              >
                <Typography variant="caption">
                  {translateTerminationText(["status"])}
                </Typography>
                {employmentStatus !==
                  AccountStatusEnums.TERMINATED.toUpperCase() &&
                  hasTerminationAbility && (
                    <KebabMenu
                      id="add-team-kebab-menu"
                      menuItems={kebabMenuOptions}
                      icon={<Icon name={IconName.THREE_DOTS_ICON} />}
                      customStyles={{
                        menuItemText: {
                          color: theme.palette.error.contrastText
                        }
                      }}
                    />
                  )}
              </Stack>
              <BasicChip
                label={toPascalCase(employmentStatus)}
                chipStyles={{
                  color: statusStyle?.color || "common.black",
                  fontWeight: 400,
                  fontSize: "0.75rem",
                  lineHeight: "1rem",
                  padding: "0.25rem 0.5rem",
                  backgroundColor:
                    statusStyle?.backgroundColor || theme.palette.grey[200],
                  borderRadius: "4rem"
                }}
              />
            </Stack>
            {supervisor && (
              <Stack
                direction="column"
                alignItems="flex-start"
                gap="0.25rem"
                justifyContent={"flex-start"}
              >
                <Typography variant="caption">
                  {translateText(["primarySupervisor"])}
                </Typography>
                <AvatarChip
                  firstName={supervisor?.manager?.name ?? ""}
                  lastName={supervisor?.manager?.lastName ?? ""}
                  avatarUrl={supervisor?.manager?.authPic ?? ""}
                  chipStyles={{
                    color: theme.palette.grey[700],
                    "& .MuiChip-label": {
                      pr: "0.5rem"
                    }
                  }}
                  isResponsiveLayout
                  smallScreenWidth={625}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default EditInfoCard;
