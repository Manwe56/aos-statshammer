import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { makeStyles, Theme } from '@material-ui/core/styles';
import {
  ArrowDownward,
  ArrowUpward,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Flag,
  PlayArrow,
  Security,
  Save as SaveIcon,
} from '@material-ui/icons';
import { fetchSequenceSimulations } from 'api';
import { BarGraph } from 'components/Graphs';
import ListItem from 'components/ListItem';
import SimulationConfigDialog from 'components/SimulationConfigDialog';
import Tabbed from 'components/Tabbed';
import _ from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sequenceSimulatorStore } from 'store/slices';
import type { ISequenceFightStep, TSequenceStep } from 'types/sequenceSimulator';
import type { IStore } from 'types/store';
import { scrollToTop } from 'utils/scrollIntoView';
import { getSequenceParticipants, getAllSequenceParticipants } from 'utils/sequenceSimulator';

const useStyles = makeStyles((theme: Theme) => ({
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.background.default,
  },
  container: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  tab: {
    padding: theme.spacing(2),
    maxWidth: '1366px',
    margin: '0 auto',
    [theme.breakpoints.down('sm')]: {
      maxWidth: '100%',
      padding: theme.spacing(1),
    },
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  select: {
    minWidth: 220,
  },
  controls: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  spacedTop: {
    marginTop: theme.spacing(2),
  },
  tableWrap: {
    overflowX: 'auto',
  },
  graph: {
    height: 330,
    marginBottom: theme.spacing(2),
  },
  muted: {
    color: theme.palette.text.secondary,
  },
  modalWeaponsList: {
    display: 'flex',
    flexDirection: 'column',
  },
}));

interface IParticipantOption {
  id: string;
  label: string;
}

const getSide = (participantId: string): 'Self' | 'Opponent' =>
  participantId.startsWith('Opponent:') ? 'Opponent' : 'Self';

const SequenceSimulator = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const sequenceSimulator = useSelector((state: IStore) => state.sequenceSimulator, _.isEqual);
  const participants = useSelector((state: IStore) => getSequenceParticipants(state), _.isEqual);
  const allParticipants = useSelector((state: IStore) => getAllSequenceParticipants(state), _.isEqual);

  const [attackerId, setAttackerId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [allOutAttack, setAllOutAttack] = useState(false);
  const [allOutDefense, setAllOutDefense] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'fight' | 'end-turn' | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [jumpToSurvivorsOnComplete, setJumpToSurvivorsOnComplete] = useState(false);
  const [editingSelectedWeaponProfileUuids, setEditingSelectedWeaponProfileUuids] = useState<string[] | undefined>(
    undefined,
  );
  const [weaponsModalStepId, setWeaponsModalStepId] = useState<string | null>(null);
  const [weaponsModalSelection, setWeaponsModalSelection] = useState<string[]>([]);

  const options: IParticipantOption[] = useMemo(
    () =>
      participants.map((participant) => ({
        id: participant.id,
        label: `[${participant.side}] ${participant.name}`,
      })),
    [participants],
  );

  const participantById = useMemo(
    () =>
      participants.reduce<Record<string, IParticipantOption>>((acc, participant) => {
        acc[participant.id] = {
          id: participant.id,
          label: `[${participant.side}] ${participant.name}`,
        };
        return acc;
      }, {}),
    [participants],
  );

  const allParticipantById = useMemo(
    () =>
      allParticipants.reduce<Record<string, IParticipantOption>>((acc, participant) => {
        acc[participant.id] = {
          id: participant.id,
          label: `[${participant.side}] ${participant.name}`,
        };
        return acc;
      }, {}),
    [allParticipants],
  );

  const involvedUnits = sequenceSimulator.results?.units ?? [];

  const weaponsModalStep = useMemo(
    () => sequenceSimulator.steps.find((step) => step.id === weaponsModalStepId) ?? null,
    [sequenceSimulator.steps, weaponsModalStepId],
  );
  const weaponsModalFightStep = weaponsModalStep?.type === 'fight' ? weaponsModalStep : null;
  const weaponsModalAttacker =
    weaponsModalFightStep && allParticipants.find((participant) => participant.id === weaponsModalFightStep.attackerId);
  const weaponsModalProfiles = weaponsModalAttacker?.unit.weapon_profiles ?? [];

  const targetOptions = useMemo(() => {
    if (!attackerId) return options;
    const attackerSide = getSide(attackerId);
    return options.filter((option) => getSide(option.id) !== attackerSide);
  }, [attackerId, options]);

  const stepHeaders = useMemo(() => {
    const labels = ['Start'];
    sequenceSimulator.steps.forEach((step, index) => {
      if (step.type === 'fight') {
        const attacker = allParticipantById[step.attackerId]?.label ?? 'Unknown';
        const target = allParticipantById[step.targetId]?.label ?? 'Unknown';
        labels.push(`S${index + 1}: ${attacker} -> ${target}`);
      } else {
        labels.push(`S${index + 1}: End turn`);
      }
    });
    return labels;
  }, [allParticipantById, sequenceSimulator.steps]);

  useEffect(() => {
    if (!options.length) {
      setAttackerId('');
      setTargetId('');
      return;
    }

    const first = options[0]?.id ?? '';
    const second = options.find((option) => getSide(option.id) !== getSide(first))?.id ?? '';
    setAttackerId((current) => current || first);
    setTargetId((current) => current || second);
  }, [options]);

  useEffect(() => {
    if (!attackerId) return;
    if (!targetOptions.length) {
      setTargetId('');
      return;
    }
    if (!targetOptions.some((option) => option.id === targetId)) {
      setTargetId(targetOptions[0].id);
    }
  }, [attackerId, targetId, targetOptions]);

  useEffect(() => {
    if (!jumpToSurvivorsOnComplete) return;
    if (sequenceSimulator.pending) return;

    setActiveTab(1);
    setJumpToSurvivorsOnComplete(false);
  }, [jumpToSurvivorsOnComplete, sequenceSimulator.pending]);

  useEffect(() => {
    scrollToTop(true);
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setEditingType(null);
    setAllOutAttack(false);
    setAllOutDefense(false);
    setEditingSelectedWeaponProfileUuids(undefined);
    const first = options[0]?.id ?? '';
    const second = options.find((option) => getSide(option.id) !== getSide(first))?.id ?? '';
    setAttackerId(first);
    setTargetId(second);
  };

  const onAddOrSaveFightStep = () => {
    if (!attackerId || !targetId || attackerId === targetId) return;

    const attacker = allParticipants.find((participant) => participant.id === attackerId);
    const attackerWeaponUuids = attacker?.unit.weapon_profiles.map((profile) => profile.uuid) ?? [];
    const sanitizedSelectedWeapons = (editingSelectedWeaponProfileUuids ?? []).filter((uuid) =>
      attackerWeaponUuids.includes(uuid),
    );
    const selectedWeaponProfileUuids =
      sanitizedSelectedWeapons.length === attackerWeaponUuids.length || !sanitizedSelectedWeapons.length
        ? undefined
        : sanitizedSelectedWeapons;

    if (editingId && editingType === 'fight') {
      dispatch(
        sequenceSimulatorStore.actions.updateStep({
          id: editingId,
          type: 'fight',
          attackerId,
          targetId,
          allOutAttack,
          allOutDefense,
          selectedWeaponProfileUuids,
        }),
      );
      resetForm();
      return;
    }

    dispatch(
      sequenceSimulatorStore.actions.addStep({
        attackerId,
        targetId,
        allOutAttack,
        allOutDefense,
        selectedWeaponProfileUuids: undefined,
      }),
    );
  };

  const onAddOrSaveEndTurnStep = () => {
    if (editingId && editingType === 'end-turn') {
      dispatch(
        sequenceSimulatorStore.actions.updateStep({
          id: editingId,
          type: 'end-turn',
        }),
      );
      resetForm();
      return;
    }

    dispatch(sequenceSimulatorStore.actions.addEndTurnStep());
  };

  const onEditStep = (step: TSequenceStep) => {
    setEditingId(step.id);
    setEditingType(step.type);
    if (step.type === 'fight') {
      setAttackerId(step.attackerId);
      setTargetId(step.targetId);
      setAllOutAttack(!!step.allOutAttack);
      setAllOutDefense(!!step.allOutDefense);
      setEditingSelectedWeaponProfileUuids(step.selectedWeaponProfileUuids);
      return;
    }
  };

  const openWeaponsModal = (step: ISequenceFightStep) => {
    const attacker = allParticipants.find((participant) => participant.id === step.attackerId);
    const allWeaponUuids = attacker?.unit.weapon_profiles.map((profile) => profile.uuid) ?? [];
    setWeaponsModalStepId(step.id);
    setWeaponsModalSelection(step.selectedWeaponProfileUuids?.length ? step.selectedWeaponProfileUuids : allWeaponUuids);
  };

  const closeWeaponsModal = () => {
    setWeaponsModalStepId(null);
    setWeaponsModalSelection([]);
  };

  const saveWeaponsModal = () => {
    if (!weaponsModalFightStep) return;
    const totalWeaponCount = weaponsModalProfiles.length;
    const selected = weaponsModalSelection.filter((uuid) =>
      weaponsModalProfiles.some((profile) => profile.uuid === uuid),
    );
    dispatch(
      sequenceSimulatorStore.actions.updateFightStepWeapons({
        id: weaponsModalFightStep.id,
        selectedWeaponProfileUuids: selected.length === totalWeaponCount ? undefined : selected,
      }),
    );
    closeWeaponsModal();
  };

  const getWeaponsDetails = (step: ISequenceFightStep) => {
    const attacker = allParticipants.find((participant) => participant.id === step.attackerId);
    const total = attacker?.unit.weapon_profiles.length ?? 0;
    if (!total) return 'none';
    if (!step.selectedWeaponProfileUuids?.length) return `all (${total})`;
    const selected = step.selectedWeaponProfileUuids.filter((uuid) =>
      attacker?.unit.weapon_profiles.some((profile) => profile.uuid === uuid),
    );
    return `${selected.length}/${total}`;
  };

  const runSequence = () => {
    setJumpToSurvivorsOnComplete(true);
    dispatch(fetchSequenceSimulations());
  };

  const invalidStepCount = sequenceSimulator.steps.filter(
    (step) =>
      step.type === 'fight'
        ? !allParticipantById[step.attackerId] || !allParticipantById[step.targetId]
        : false,
  ).length;

  return (
    <div className={classes.app}>
      <div className={classes.container}>
        <Tabbed
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabNames={['Setup', 'Survivors', 'Charts']}
          tabContent={[
            <div className={classes.tab}>
              <ListItem header="Fight Sequence" loading={sequenceSimulator.pending} loaderDelay={0}>
                <Typography className={classes.muted}>
                  Each step uses all active weapons from the attacker. Remaining model counts carry through the full
                  sequence.
                </Typography>

                <div className={classes.row}>
                  <Select
                    value={attackerId}
                    onChange={(event) => setAttackerId(String(event.target.value))}
                    className={classes.select}
                    displayEmpty
                  >
                    {options.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant="body1">attacks</Typography>
                  <Select
                    value={targetId}
                    onChange={(event) => setTargetId(String(event.target.value))}
                    className={classes.select}
                    displayEmpty
                  >
                    {targetOptions.map((option) => (
                      <MenuItem key={option.id} value={option.id}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={editingId ? <SaveIcon /> : <PlayArrow />}
                    onClick={onAddOrSaveFightStep}
                    disabled={!attackerId || !targetId || attackerId === targetId}
                  >
                    {editingId && editingType === 'fight' ? 'Save fight step' : 'Add fight step'}
                  </Button>
                  <Button
                    variant={allOutAttack ? 'contained' : 'outlined'}
                    color={allOutAttack ? 'secondary' : 'default'}
                    startIcon={<Flag />}
                    onClick={() => setAllOutAttack((value) => !value)}
                  >
                    All out attack
                  </Button>
                  <Button
                    variant={allOutDefense ? 'contained' : 'outlined'}
                    color={allOutDefense ? 'secondary' : 'default'}
                    startIcon={<Security />}
                    onClick={() => setAllOutDefense((value) => !value)}
                  >
                    All out defense
                  </Button>
                </div>

                <div className={classes.row}>
                  <Button
                    variant="contained"
                    onClick={onAddOrSaveEndTurnStep}
                  >
                    {editingId && editingType === 'end-turn' ? 'Save end turn step' : 'Add end turn step'}
                  </Button>
                  {editingId && (
                    <Button variant="outlined" onClick={resetForm}>
                      Cancel edit
                    </Button>
                  )}
                </div>

                <div className={classes.spacedTop}>
                  <Typography variant="h6">Sequence Steps</Typography>
                  {sequenceSimulator.steps.length === 0 && (
                    <Typography className={classes.muted}>No steps yet. Add at least one step.</Typography>
                  )}
                  {invalidStepCount > 0 && (
                    <Typography color="error">
                      {invalidStepCount} step(s) reference units no longer available and will be ignored when running.
                    </Typography>
                  )}
                  <div className={classes.tableWrap}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>#</TableCell>
                          <TableCell>Step</TableCell>
                          <TableCell>Details</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sequenceSimulator.steps.map((step, index) => (
                          <TableRow key={step.id}>
                            <TableCell>{index + 1}</TableCell>
                            {step.type === 'fight' ? (
                              <>
                                <TableCell>
                                  {`${participantById[step.attackerId]?.label ?? 'Unknown'} -> ${participantById[step.targetId]?.label ?? 'Unknown'}`}
                                </TableCell>
                                <TableCell>
                                  {`AOA: ${step.allOutAttack ? 'on' : 'off'} | AOD: ${step.allOutDefense ? 'on' : 'off'} | Weapons: ${getWeaponsDetails(step)}`}
                                </TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>End turn</TableCell>
                                <TableCell>Reset all save modifiers from all out attack</TableCell>
                              </>
                            )}
                            <TableCell align="right">
                              <div className={classes.controls}>
                                {step.type === 'fight' && (
                                  <>
                                    <Button
                                      size="small"
                                      variant={step.allOutAttack ? 'contained' : 'outlined'}
                                      color={step.allOutAttack ? 'secondary' : 'default'}
                                      onClick={() =>
                                        dispatch(
                                          sequenceSimulatorStore.actions.toggleFightStepAction({
                                            id: step.id,
                                            action: 'allOutAttack',
                                          }),
                                        )
                                      }
                                    >
                                      AOA
                                    </Button>
                                    <Button
                                      size="small"
                                      variant={step.allOutDefense ? 'contained' : 'outlined'}
                                      color={step.allOutDefense ? 'secondary' : 'default'}
                                      onClick={() =>
                                        dispatch(
                                          sequenceSimulatorStore.actions.toggleFightStepAction({
                                            id: step.id,
                                            action: 'allOutDefense',
                                          }),
                                        )
                                      }
                                    >
                                      AOD
                                    </Button>
                                    <Button size="small" variant="outlined" onClick={() => openWeaponsModal(step)}>
                                      Weapons
                                    </Button>
                                  </>
                                )}
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    dispatch(
                                      sequenceSimulatorStore.actions.moveStep({
                                        id: step.id,
                                        direction: 'up',
                                      }),
                                    )
                                  }
                                  disabled={index === 0}
                                >
                                  <ArrowUpward fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    dispatch(
                                      sequenceSimulatorStore.actions.moveStep({
                                        id: step.id,
                                        direction: 'down',
                                      }),
                                    )
                                  }
                                  disabled={index === sequenceSimulator.steps.length - 1}
                                >
                                  <ArrowDownward fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => onEditStep(step)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    dispatch(sequenceSimulatorStore.actions.removeStep({ id: step.id }))
                                  }
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className={classes.spacedTop}>
                  <Grid container spacing={2}>
                    <Grid item>
                      <SimulationConfigDialog />
                    </Grid>
                    <Grid item>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={runSequence}
                        startIcon={<PlayArrow />}
                        disabled={sequenceSimulator.pending || sequenceSimulator.steps.length === 0}
                      >
                        Run sequence simulations
                      </Button>
                    </Grid>
                    <Grid item>
                      <Button
                        variant="outlined"
                        onClick={() => dispatch(sequenceSimulatorStore.actions.clearSteps())}
                        disabled={sequenceSimulator.pending || sequenceSimulator.steps.length === 0}
                      >
                        Clear sequence
                      </Button>
                    </Grid>
                  </Grid>
                </div>
              </ListItem>
            </div>,
            <div className={classes.tab}>
              <ListItem header="Survivor Distributions" loading={sequenceSimulator.pending} loaderDelay={0}>
                {sequenceSimulator.error && <Typography color="error">{String(sequenceSimulator.error)}</Typography>}
                {!involvedUnits.length && !sequenceSimulator.pending && (
                  <Typography className={classes.muted}>Run a sequence to see survivor distributions.</Typography>
                )}

                {involvedUnits.map((unit) => (
                  <div key={unit.unitId} className={classes.spacedTop}>
                    <Typography variant="h6">{`[${unit.side}] ${unit.name}`}</Typography>
                    <Typography className={classes.muted}>{`Initial models: ${unit.initialModels} | Mean remaining: ${unit.meanRemaining}`}</Typography>
                    <div className={classes.tableWrap}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Remaining models</TableCell>
                            <TableCell>Final %</TableCell>
                            {stepHeaders.map((header, index) => (
                              <TableCell key={`unit-${unit.unitId}-dist-step-header-${index}`}>{`${header} %`}</TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Array.from(
                            new Set(
                              unit.stepDistributions.flatMap((distribution) =>
                                distribution.map((bucket) => bucket.models),
                              ),
                            ),
                          )
                            .sort((a, b) => a - b)
                            .map((models) => {
                              const finalBucket = unit.distribution.find((bucket) => bucket.models === models);
                              return (
                                <TableRow key={`${unit.unitId}-${models}`}>
                                  <TableCell>{models}</TableCell>
                                  <TableCell>{finalBucket ? `${finalBucket.probability}%` : '0%'}</TableCell>
                                  {stepHeaders.map((_, index) => {
                                    const stepBucket = unit.stepDistributions[index]?.find(
                                      (bucket) => bucket.models === models,
                                    );
                                    return (
                                      <TableCell key={`${unit.unitId}-${models}-step-${index}`}>
                                        {stepBucket ? `${stepBucket.probability}%` : '0%'}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </ListItem>
            </div>,
            <div className={classes.tab}>
              <ListItem header="Survivor Charts" loading={sequenceSimulator.pending} loaderDelay={0}>
                {!involvedUnits.length && !sequenceSimulator.pending && (
                  <Typography className={classes.muted}>Run a sequence to visualize survivor distributions.</Typography>
                )}
                {involvedUnits.map((unit) => {
                  const seriesName = `${unit.side}:${unit.name}`;
                  const data = unit.distribution.map((bucket) => ({
                    remaining: bucket.models,
                    [seriesName]: bucket.probability,
                  }));

                  return (
                    <BarGraph
                      key={unit.unitId}
                      title={`[${unit.side}] ${unit.name} - Remaining models distribution`}
                      className={classes.graph}
                      data={data}
                      series={[seriesName]}
                      xAxis={{ dataKey: 'remaining', type: 'number', tickCount: 8 }}
                      yAxis={{ type: 'number', tickFormatter: (value) => `${value}%` }}
                      yAxisLabel={{ value: 'Probability (%)' }}
                    />
                  );
                })}
              </ListItem>
            </div>,
          ]}
        />

        <Dialog open={!!weaponsModalFightStep} onClose={closeWeaponsModal} maxWidth="sm" fullWidth>
          <DialogTitle>Select attacking weapons</DialogTitle>
          <DialogContent dividers>
            {!weaponsModalProfiles.length && (
              <Typography className={classes.muted}>No weapon profile available for this attacker.</Typography>
            )}
            {weaponsModalProfiles.length > 0 && (
              <div className={classes.modalWeaponsList}>
                {weaponsModalProfiles.map((profile) => (
                  <FormControlLabel
                    key={profile.uuid}
                    control={(
                      <Checkbox
                        checked={weaponsModalSelection.includes(profile.uuid)}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setWeaponsModalSelection((current) => [...current, profile.uuid]);
                            return;
                          }
                          setWeaponsModalSelection((current) => current.filter((uuid) => uuid !== profile.uuid));
                        }}
                        color="primary"
                      />
                    )}
                    label={profile.name || 'Weapon profile'}
                  />
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeWeaponsModal}>Cancel</Button>
            <Button
              color="primary"
              variant="contained"
              onClick={saveWeaponsModal}
              disabled={!weaponsModalSelection.length && weaponsModalProfiles.length > 0}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default SequenceSimulator;
