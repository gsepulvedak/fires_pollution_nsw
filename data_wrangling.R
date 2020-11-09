library(sf)
library(tidyverse)
library(lubridate)


# firefreq data ---------------------
# Read bushfires data
fires <- st_read("/home/gon/Documents/Master/sem4/FIT5147_DataViz/project/data/qgis/bushfires_data.gpkg")

# Eliminating "fires" with burnt area less than 10m2 and duration > 1 day
fires_to_del <- fires %>% filter(AreaHa*10000 < 10, Duration > 1) %>% pull(FireName)
fires_clean <-fires %>% filter(FireName != fires_to_del) # 443 fires left (only 1 eliminated)

# Imputing mean of closest neighbours (in burnt area and space) (4 days rounded)
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse(FireName == "Indigo", 3.5, Duration)) %>% 
  mutate(EndDate = ifelse(FireName == "Indigo", ymd("2019-11-29"), EndDate)) %>% 
  mutate(EndDate = as_date(EndDate))

# Duration imputation of important (big) fires (from press articles analysis)
fires_clean <- fires_clean %>% 
  mutate(EndDate = ifelse(FireName == "Kingsgate, Red Range", ymd("2019-10-12"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Wandsworth", ymd("2019-11-15"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Kangawalla", ymd("2019-11-09"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Kaputar Fire", ymd("2019-11-04"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Moggs Swamp", ymd("2019-12-15"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Andersons Creek", ymd("2019-12-21"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Pearson Trail Complex, Dungowan", ymd("2020-01-06"), EndDate)) %>% 
  mutate(EndDate = ifelse(FireName == "Mount Youngal", ymd("2020-01-23"), EndDate)) %>% 
  mutate(EndDate = as_date(EndDate))

# Recompute duration of fires with new end date
fires_clean <- fires_clean %>% 
  mutate(Duration = as.integer(fires_clean$EndDate - fires_clean$StartDate))

# Imputing mean of duration of fires with AreaHa between 1000 and 2000 Ha
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse((AreaHa > 1000 & AreaHa < 2000 & Duration < 0), 21.6, Duration))

# Same for fires with Area between 2000 and 9000
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse((AreaHa > 2000 & AreaHa < 9500 & Duration < 0), 31.7, Duration))

# Replacing true nulls by NAs
fires_clean <- fires_clean %>% 
  mutate(Duration = ifelse(Duration < 0, NA, Duration)) %>% 
  mutate(EndDate = as_date(ifelse(EndDate < 2019, NA, EndDate)))


# Helper function to do window counting
window_count <- function(start_date){
  active <- fires_clean %>% 
    st_drop_geometry() %>%
    group_by(StartDate) %>% 
    filter(StartDate <= start_date, EndDate >= start_date) %>% 
    nrow()
  return(active)
}

# Vectorize window count
vw <- Vectorize(window_count)

# Add active fires to fires_clean
fires_with_actives <- fires_clean %>% 
  mutate(active_fires = vw(fires_clean$StartDate))

# firefreq per day df
firefreq <- fires_with_actives %>% 
  st_drop_geometry() %>% 
  group_by(StartDate) %>%
  summarise(dayFreq = n())

# firefreq source df
firefreq <- inner_join(firefreq, active_fires)

# Period span dataframe
fire_season <- tibble(date = seq(ymd("2019-07-01"), ymd("2020-06-30"), by = "1 day"))

# generate df for visualisation
firesFreq <- left_join(fire_season, firefreq, by = c("date" = "StartDate")) %>% 
  mutate(dayFreq = ifelse(is.na(dayFreq), 0, dayFreq))

firesFreq <- firesFreq %>% mutate(active_fires = vw(firesFreq$date))

# Clean memory
rm(fires, active_fires, fire_season)

# Save to csv
write_csv(firesFreq, "data/firesFreq.csv")
